const video = document.getElementById('video');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const statusMessage = document.getElementById('status');
const attendanceData = document.getElementById('attendance-data');
const resultDiv = document.getElementById('result');
let scanningInterval = null;
let timeoutId = null;

// Function to start scanning
function startScanning() {
    statusMessage.textContent = "Initializing camera...";
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            scanQRCode(); 
            toggleButton(); // Show "Stop Scanning" button, hide "Start Scanning" button

            timeoutId = setTimeout(stopScanning, 15000);
        })
        .catch(function(error) {
            statusMessage.textContent = "Error accessing camera.";
            console.error("Camera error:", error);
        });
}

function stopScanning() {
    if(scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }

    if(timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    video.srcObject.getTracks().forEach((track) => track.stop());
    toggleButton();
    statusMessage.textContent = "Scanning stoped.";
}

// Function to scan the QR code
function scanQRCode() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scanningInterval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

            if (qrCode) {
                console.log("QR code detected:", qrCode.data);
                clearInterval(scanningInterval);
                clearTimeout(timeoutId);
                video.srcObject.getTracks().forEach((track) => track.stop());
                processQRCode(qrCode.data);
                toggleButton();
            }
        }
    }, 300); // Scanning every 300ms
}

// Function to process and validate the scanned QR code
async function processQRCode(data) {
    console.log("Processing QR code:", data);
    statusMessage.textContent = "QR Code detected!";
    resultDiv.classList.remove('hidden');

    // Validate the QR code with the backend
    try {
        const response = await fetch('http://127.0.0.1:5000/api/validate_qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ qr_code: data })
        });

        const result = await response.json();

        // Display the result
        if (result.status === "success") {
            attendanceData.textContent = result.message;
        } else {
            attendanceData.textContent = "Invalid QR Code";
        }
    } catch (error) {
        console.error('Error:', error);
        attendanceData.textContent = "Error validating QR Code";
    }
}

function toggleButton() {
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
}

startButton.addEventListener('click', startScanning);
stopButton.addEventListener('click', stopScanning);