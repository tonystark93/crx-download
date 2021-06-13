let extensionURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let currentEXTId = undefined;

function getChromeVersion() {
    var pieces = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
    if (pieces == null || pieces.length != 5) {
        return undefined;
    }
    pieces = pieces.map(piece => parseInt(piece, 10));
    return {
        major: pieces[1],
        minor: pieces[2],
        build: pieces[3],
        patch: pieces[4]
    };
}

function getNaclArch() {
    var nacl_arch = 'arm';
    if (navigator.userAgent.indexOf('x86') > 0) {
        nacl_arch = 'x86-32';
    } else if (navigator.userAgent.indexOf('x64') > 0) {
        nacl_arch = 'x86-64';
    }
    return nacl_arch;
}
let currentVersion = getChromeVersion();
let version = currentVersion.major + "." + currentVersion.minor + "." + currentVersion.build + "." + currentVersion.patch;
const nacl_arch = getNaclArch();

function download(downloadAs) {
    var query = {
        active: true,
        currentWindow: true
    };

    return chrome.tabs.getSelected(null, function (tab) {
        result = extensionURLPattern.exec(tab.url);
        if (result && result[1]) {
            currentEXTId = result[1];
            var title = tab.title.match(/^(.*[-])/);
            if (title) {
                title = title[0].slice(0, title[0].length - 2);
            } else {
                title = currentEXTId;
            }
            var name = (title).split(" ").join("-");
            if (downloadAs === "zip") {
                url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&x=id%3D${currentEXTId}%26installsource%3Dondemand%26uc&nacl_arch=${nacl_arch}&acceptformat=crx2,crx3`;
                downloadZipFile(url, function (blob, publicKey) {
                    downloadZIP(blob, name);
                });
            } else if (downloadAs === "crx") {
                url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&acceptformat=crx2,crx3&x=id%3D${currentEXTId}%26uc&nacl_arch=${nacl_arch}`;
                console.log(url, name)
                downloadAsCRXFile(url, name);
            }
        }
    });
}

function converToZip(arraybuffer, callback) {

    var data = arraybuffer;
    var buf = new Uint8Array(data);
    var publicKeyLength, signatureLength, header, zipStartOffset;
    if (buf[4] === 2) {
        header = 16;
        publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24);
        signatureLength = 0 + buf[12] + (buf[13] << 8) + (buf[14] << 16) + (buf[15] << 24);
        zipStartOffset = header + publicKeyLength + signatureLength;
    } else {
        publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24 >>> 0);
        zipStartOffset = 12 + publicKeyLength;
    }
    // 16 = Magic number (4), CRX format version (4), lengths (2x4)

    var zipFragment = new Blob([
        new Uint8Array(arraybuffer, zipStartOffset)
    ], {
        type: 'application/zip'
    });
    callback(zipFragment);
}

function downloadZipFile(url, callback, errCallback, xhrProgressListener) {
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


function downloadZIP(blob, fileName) {
    let url = URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: fileName + ".zip",
        saveAs: true
    }, function (downloadId) {
        if (chrome.runtime.lastError) {
            alert('An error occurred while trying to save ' + fileName + ':\n\n' +
                chrome.runtime.lastError.message);
        }
    });
}

function downloadAsCRXFile(url, fileName) {
    chrome.downloads.download({
        url: url,
        filename: fileName + ".crx",
        saveAs: true
    });
}
chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
    'id': "parent",
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*']
});
chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
    'onclick': function () {
        download("crx")
    },
    parentId: "parent", //No i18n
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*']
});
chrome.contextMenus.create({
    'title': 'Download ZIP for this extension',
    'contexts': ['all'],
    'onclick': function () {
        download("zip")
    },
    parentId: "parent", //No i18n
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*']
});
chrome.runtime.setUninstallURL("https://thebyteseffect.com/posts/reason-for-uninstall-crx-extractor/", null);
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.tabs.create({
            url: "https://thebyteseffect.com/posts/crx-extractor-features/"
        });

    }
});
