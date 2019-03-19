
function downloadCRX (blob, filename) {
    let url=URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: filename
    }, function (downloadId) {
        if (chrome.runtime.lastError) {
            alert('An error occurred while trying to save ' + filename + ':\n\n' +
                chrome.runtime.lastError.message);
        }
    });
}
