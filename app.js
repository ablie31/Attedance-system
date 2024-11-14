// Initialize the QR code scanner
const scanner = new Html5Qrcode("preview");

document.getElementById('startScan').addEventListener('click', function () {
    console.log("Start Scan button clicked");
    
    // Start scanning
    scanner.start(
        { facingMode: "environment" },  // Use the rear-facing camera on mobile devices
        {
            fps: 10,  // Set frames per second for the scan
            qrbox: { width: 250, height: 250 }  // Size of the scanning box
        },
        (decodedText, decodedResult) => {
            // Success callback when a QR code is successfully scanned
            console.log("Scanned Text: ", decodedText);
            document.getElementById('result').textContent = "Scanned Content: " + decodedText;
        },
        (error) => {
            // Error callback during scanning
            console.log("Scanning failed: ", error);
        }
    ).catch(err => {
        // Handle errors that occur during the scanner start process
        console.error("Camera failed to start: ", err);
    });
    
    // Debug logs for troubleshooting
    console.log("QR code scanner is active.");
});
