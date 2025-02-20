document.addEventListener('DOMContentLoaded', function() {
    // var timeoutDuration = 600000;
    var timeoutDuration = 600000;
    // Function to trigger auto backup every 10 minutes
    function startAutoBackup() {
        setTimeout(() => {
            // Call the Python auto_backup method
            window.pywebview.api.auto_backup().then((response) => {
                displayMessage("<i class='bi bi-info-circle-fill'></i> Auto-backup saved.");
                console.log(response); // Log the success message
            }).catch((error) => {
                console.error("Error during auto backup:", error);
            });

            // Recursively set the timeout for continuous backups
            startAutoBackup();
        }, timeoutDuration); // 600,000ms = 10 minutes
    }

    // Start auto backup after the page loads
    startAutoBackup();
});