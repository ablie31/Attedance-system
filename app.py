import qrcode
import pandas as pd
import os
from flask import Flask, request, jsonify, session, redirect, url_for
from datetime import datetime, date
import sqlite3
from flask_cors import CORS
import hashlib
from functools import wraps

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests
app.secret_key = "Abdoulie3163607"  # Replace with a strong, unique key

# Create necessary directories if they don't exist
os.makedirs('qrcodes', exist_ok=True)
os.makedirs('attendance', exist_ok=True)

# Database connection function
def get_db_connection():
    conn = sqlite3.connect('attendance.db')
    conn.row_factory = sqlite3.Row
    return conn

# Function to create required tables
def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            position TEXT,
            department TEXT,
            QR_code TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL
        )
    ''')
# Admin sign-up
@app.route('/admin_signup', methods=['POST'])
def admin_signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Hash the password
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    # Store in the database
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO admins (username, password_hash) VALUES (?, ?)", (username, password_hash))
        conn.commit()
        return jsonify({"message": "Admin registered successfully."}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already exists."}), 400
    finally:
        conn.close()

# Admin login
@app.route('/admin_login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Hash the password for comparison
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    # Verify the username and password
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admins WHERE username = ? AND password_hash = ?", (username, password_hash))
    admin = cursor.fetchone()
    conn.close()

    if admin:
        session['admin_logged_in'] = True
        return jsonify({"message": "Login successful."}), 200
    else:
        return jsonify({"message": "Invalid credentials."}), 401

# Admin logout
@app.route('/admin_logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))
# Generate QR code function
def generate_qr_code(employee_id):
    try:
        qr = qrcode.make(employee_id)
        file_path = f"qrcodes/{employee_id}.png"
        qr.save(file_path)
        return file_path
    except Exception as e:
        print(f"Error generating QR code for {employee_id}: {e}")
        return None

# Generate unique employee ID
def generate_unique_id(name, conn):
    prefix = name[:2].upper()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(CAST(SUBSTR(id, 3) AS INTEGER)) FROM employees WHERE id LIKE ?", (f'{prefix}%',))
    max_number = cursor.fetchone()[0]
    unique_number = (max_number + 1) if max_number is not None else 1
    return f"{prefix}{unique_number:03d}"

# Add employee endpoint
@app.route('/add_employee', methods=['POST'])
def add_employee():
    data = request.get_json()
    name = data.get('name')
    position = data.get('position', 'Unknown')
    department = data.get('department', 'Unknown')
    
    if not name:
        return jsonify({'message': 'Name is required'}), 400
    
    conn = get_db_connection()
    employee_id = generate_unique_id(name, conn)

    cursor = conn.cursor()
    cursor.execute("INSERT INTO employees (id, name, position, department) VALUES (?, ?, ?, ?)", 
                   (employee_id, name, position, department))
    conn.commit()

    qr_code_file = generate_qr_code(employee_id)
    cursor.execute("UPDATE employees SET QR_code = ? WHERE id = ?", (qr_code_file, employee_id))
    conn.commit()
    conn.close()

    return jsonify({'message': f'Employee {name} added with ID {employee_id}', 'qr_code_file': qr_code_file})

# Get all employees endpoint
@app.route('/employees', methods=['GET'])
def get_employees():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees")
    employees = cursor.fetchall()
    conn.close()
    
    employee_list = [{'id': row['id'], 'name': row['name'], 'position': row['position'], 'department': row['department'], 'QR_code': row['QR_code']} for row in employees]
    return jsonify(employee_list)

# Update employee details
@app.route('/employee/<id>', methods=['PUT'])
def update_employee(id):
    data = request.get_json()
    name = data.get('name')
    position = data.get('position')
    department = data.get('department')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees WHERE id = ?", (id,))
    employee = cursor.fetchone()

    if employee:
        cursor.execute("UPDATE employees SET name = ?, position = ?, department = ? WHERE id = ?", 
                       (name, position, department, id))
        conn.commit()
        conn.close()
        return jsonify({'message': f'Employee {id} updated successfully'})
    else:
        conn.close()
        return jsonify({'message': 'Employee not found'}), 404

# Delete employee
@app.route('/employee/<id>', methods=['DELETE'])
def delete_employee(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees WHERE id = ?", (id,))
    employee = cursor.fetchone()

    if employee:
        cursor.execute("DELETE FROM employees WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": f"Employee with ID {id} has been deleted successfully."}), 200
    else:
        conn.close()
        return jsonify({"message": f"Employee with ID {id} not found."}), 404

# Export attendance to Excel
@app.route('/export_attendance', methods=['GET'])
def export_attendance():
    conn = get_db_connection()
    query = "SELECT * FROM attendance WHERE DATE(timestamp) = DATE('now')"
    attendance_data = pd.read_sql_query(query, conn)
    conn.close()

    file_path = f"attendance/attendance_{date.today()}.xlsx"
    attendance_data.to_excel(file_path, index=False)
    return jsonify({"message": "Attendance exported successfully", "file_path": file_path})

# Initialize tables
create_tables()

if __name__ == '__main__':
    app.run(debug=True)
