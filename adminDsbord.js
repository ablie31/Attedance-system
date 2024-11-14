// Add Employee
document.getElementById("add-employee-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const employeeId = document.getElementById("employee-id").value;
    const employeeName = document.getElementById("employee-name").value;
    const position = document.getElementById("position").value;
    const department = document.getElementById("department").value;

    fetch('http://127.0.0.1:5000/add_employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            employee_id: employeeId, 
            name: employeeName, 
            position: position, 
            department: department 
        })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Error:", error));
});

// Update Employee
document.getElementById("update-employee-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const employeeId = document.getElementById("update-employee-id").value;
    const newName = document.getElementById("new-employee-name").value;
    const position = document.getElementById("position").value;
    const department = document.getElementById("department").value;

    fetch('http://127.0.0.1:5000/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            employee_id: employeeId, 
            name: newName, 
            position: position, 
            department: department 
        })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Error:", error));
});
// Delete Employee
document.getElementById("delete-employee-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const employeeId = document.getElementById("delete-employee-id").value;

    fetch('http://127.0.0.1:5000/employee', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Error:", error));
});

// Fetch Attendance Logs
function fetchAttendance() {
    fetch('http://127.0.0.1:5000/view_attendance')
    .then(response => response.json())
    .then(data => {
        const attendanceLogs = document.getElementById("attendance-logs");
        attendanceLogs.innerHTML = "<h3>Attendance Logs</h3>";
        data.attendance.forEach(log => {
            attendanceLogs.innerHTML += `<p>${log.employee_id} - ${log.date} - ${log.status}</p>`;
        });
    })
    .catch(error => console.error("Error:", error));
}

// Export Attendance to Excel
function exportAttendance() {
    fetch('http://127.0.0.1:5000/export_attendance')
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_logs.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => console.error("Error:", error));
}
