let chromeURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let microsoftURLPattern = /^https?:\/\/microsoftedge.microsoft.com\/addons\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let chromeNewURLPattern = /^https?:\/\/chromewebstore.google.com\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;


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

function getTabTitle(title, currentEXTId, url) {
    if (!chromeNewURLPattern.exec(url)) {
        title = title.match(/^(.*[-])/);
        if (title) {
            title = title[0].split(' - ').join("");
        } else {
            title = currentEXTId;
        }
    }
    // Ѐ-ӿ matches cyrillic characters
    return (title).replace(/[&\/\\#,+()$~%.'":*?<>|{}\sЀ-ӿ]/g, '-').replace(/-*$/g, '').replace(/-+/g, '-');
}

function download(downloadAs, tab) {

    var query = {
        active: true,
        currentWindow: true
    };
    result = chromeURLPattern.exec(tab.url);
    if (!result) {
        result = chromeNewURLPattern.exec(tab.url);
    }
    if (result && result[1]) {
        var name = getTabTitle(tab.title, result[1], tab.url);
        if (downloadAs === "zip") {
            url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&x=id%3D${result[1]}%26installsource%3Dondemand%26uc&nacl_arch=${nacl_arch}&acceptformat=crx2,crx3`;
            convertURLToZip(url, function (urlVal) {
                downloadFile(urlVal, name + ".zip");

            });
        } else if (downloadAs === "crx") {
            url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&acceptformat=crx2,crx3&x=id%3D${result[1]}%26uc&nacl_arch=${nacl_arch}`;
            downloadFile(url, name + ".crx", result[1] + ".crx");
        }
    }
    var edgeId = microsoftURLPattern.exec(tab.url);
    if (edgeId && edgeId[1] && downloadAs === "crx") {
        var name = getTabTitle(tab.title, edgeId[1], tab.url);
        url = `https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&prod=chromiumcrx&prodchannel=&x=id%3D${edgeId[1]}%26installsource%3Dondemand%26uc`;
        downloadFile(url, name + ".crx", edgeId[1] + ".crx");
    }
    // });
}

function ArrayBufferToBlob(arraybuffer, callback) {

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

    return new Blob([
        new Uint8Array(arraybuffer, zipStartOffset)
    ], {
        type: 'application/zip'
    });
}

function convertURLToZip(url, callback, xhrProgressListener) {
    var requestUrl = url;
    fetch(requestUrl).then(function (response) {
        return (response.arrayBuffer())
    }).then((res) => {
        var zipFragment = ArrayBufferToBlob(res);
        var reader = new FileReader();
        reader.readAsDataURL(zipFragment);
        reader.onloadend = function () {
            var base64data = reader.result;
            callback(base64data);
        }

    });

}


function downloadFile(url, fileName, currentEXTId = "unknown", _fails = 0) {
    chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs: true
    }, function () {
        if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message === "Invalid filename" && _fails < 1) {
                downloadFile(url, currentEXTId, currentEXTId, _fails + 1);
            } else {
                alert('An error occurred while trying to save ' + fileName + ':\n\n' +
                    chrome.runtime.lastError.message);
            }
        }
    });
}




function onClickEvent(info, tab) {

    if (info.menuItemId === "crx" || info.menuItemId === "crxmicrosoft") {
        download("crx", tab)
    } else if (info.menuItemId === "zip") {
        download("zip", tab)
    }
    console.log(info)

}
chrome.contextMenus.onClicked.addListener(onClickEvent);


chrome.runtime.setUninstallURL("https://thebyteseffect.com/posts/reason-for-uninstall-crx-extractor/", null);
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.tabs.create({
            url: "https://thebyteseffect.com/posts/crx-extractor-features/"
        });

    }
    const parent = chrome.contextMenus.create({
        'title': 'Download CRX for this extension',
        'contexts': ['all'],
        'id': "parent",
        'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
    });
    chrome.contextMenus.create({
        'title': 'Download CRX for this extension',
        'contexts': ['all'],
        id: "crx",
        parentId: parent,
        'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
    });

    chrome.contextMenus.create({
        'title': 'Download CRX for this extension',
        'contexts': ['all'],
        parentId: parent,
        id: "crxmicrosoft",
        'documentUrlPatterns': ['https://microsoftedge.microsoft.com/addons/detail/*']
    });
    chrome.contextMenus.create({
        'title': 'Download ZIP for this extension',
        'contexts': ['all'],
        id: "zip",
        parentId: parent,
        'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
    });
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    download(request.download, request.tab);
});
