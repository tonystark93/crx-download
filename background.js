let extensionURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let currentEXTId = undefined;

function download (downloadAs) {
    var query = { active: true, currentWindow: true };

    return chrome.tabs.getSelected(null, function (tab) {
        result = extensionURLPattern.exec(tab.url);
        if (result[1]) {
            currentEXTId = result[1];
            if (downloadAs === "zip") {
                url = 'https://clients2.google.com/service/update2/crx?response=redirect&prodversion=49.0&x=id%3D' + currentEXTId + '%26installsource%3Dondemand%26uc';
                downloadZipFile(url, function (blob, publicKey) {
                    downloadZIP(blob, currentEXTId + ".zip");                   
                });
            } else if (downloadAs === "crx") {
                url = "https://clients2.google.com/service/update2/crx?response=redirect&x=id%3D" + currentEXTId + "%26uc&prodversion=32";
                console.log(url, currentEXTId)
                downloadAsCRXFile(url, currentEXTId);
            }
        }

    });
}
function converToZip (arraybuffer, callback) {

    var data = arraybuffer;
    var buf = new Uint8Array(data);

    // 43 72 32 34 (Cr24)
    if (buf[0] !== 67 || buf[1] !== 114 || buf[2] !== 50 || buf[3] !== 52) {
        throw new Error("Invalid header: Does not start with Cr24.");
    }

    // 02 00 00 00
    if (buf[4] !== 2 || buf[5] !== 0 || buf[6] !== 0 || buf[7] !== 0) {
        throw new Error("Unexpected crx format version number.");
    }

    var publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24);
    var signatureLength = 0 + buf[12] + (buf[13] << 8) + (buf[14] << 16) + (buf[15] << 24);

    // 16 = Magic number (4), CRX format version (4), lengths (2x4)
    var header = 16;
    var zipStartOffset = header + publicKeyLength + signatureLength;
    var zipFragment = new Blob([
        new Uint8Array(arraybuffer, zipStartOffset)
    ], {
            type: 'application/zip'
        });
    callback(zipFragment);
}

function downloadZipFile (url, callback, errCallback, xhrProgressListener) {
    var requestUrl = url;
    var x = new XMLHttpRequest();
    x.open('GET', requestUrl);
    x.responseType = 'arraybuffer';
    x.onprogress = xhrProgressListener;
    x.onload = function () {
        converToZip(x.response, callback);
    };
    x.send();
}


function downloadZIP (blob, fileName) {
    let url=URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs: true
    }, function (downloadId) {
        if (chrome.runtime.lastError) {
            alert('An error occurred while trying to save ' + fileName + ':\n\n' +
                chrome.runtime.lastError.message);
        }
    });
}
function downloadAsCRXFile(url,fileName){
    chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs:true
    });
}
chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
   'id':"parent",
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*']
});
chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
    'onclick': function(){
        download("crx")
    },
    parentId: "parent",//No i18n
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*']
});
chrome.contextMenus.create({
    'title': 'Download ZIP for this extension',
    'contexts': ['all'],
    'onclick': function () {
        download("zip")
    },
    parentId: "parent",//No i18n
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*']
});
chrome.runtime.setUninstallURL("https://thebyteseffect.com/posts/reason-for-uninstall-crx-extractor/", null);
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
      chrome.tabs.create({ url: "https://thebyteseffect.com/posts/crx-extractor-features/" });
  
    }
  });