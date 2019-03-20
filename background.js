
function downloadZIP (blob, fileName) {
    let url=URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: fileName
    }, function (downloadId) {
        if (chrome.runtime.lastError) {
            alert('An error occurred while trying to save ' + fileName + ':\n\n' +
                chrome.runtime.lastError.message);
        }
    });
}
function downloadCRX(url,fileName){
    chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs:true
    });
}