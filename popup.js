

let chromeURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let chromeNewURLPattern = /^https?:\/\/chromewebstore.google.com\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let microsoftURLPattern = /^https?:\/\/microsoftedge.microsoft.com\/addons\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;


function ready() {
    document.getElementById('downloadZIP').onclick = async function () {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        chrome.runtime.sendMessage({download:"zip", tab: tab});
    };
    document.getElementById('downloadCRX').onclick = async function () {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        chrome.runtime.sendMessage({download:"crx",tab:tab});
    };

    document.getElementById("convertCRXToZip").onchange = function (files) {
        setTimeout(() => {
            document.getElementById("loader").style.display = "none";
            document.getElementById("downloadCRXToZip").style.display = "block";
        }, 2000);
        document.getElementById("loader").style.display = "block";
        document.getElementById("downloadCRXToZip").style.display = "none";

        return false;
    }
    document.getElementById("downloadCRXToZip").onclick = function () {
        var file = document.getElementById("convertCRXToZip").files[0];

        var reader = new FileReader();
        reader.onload = function (e) {
            var data = reader.result;
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
            var zip = buf.slice(zipStartOffset, buf.length);
            var fileName = file.name.replace(".crx", ".zip")
            var blob = new Blob([zip], { type: "application/octet-stream" });
            var url = window.URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: fileName,
                saveAs: true
            });

        }
        reader.readAsArrayBuffer(file);


    }
    document.getElementById('rating').onclick = function () {
        window.open("https://chrome.google.com/webstore/detail/crx-extractordownloader/ajkhmmldknmfjnmeedkbkkojgobmljda/reviews");
    };
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
        tab = tab[0];
        var id = chromeURLPattern.exec(tab.url);

        if (!id) {
            id = chromeNewURLPattern.exec(tab.url);
        }
        var edgeId = microsoftURLPattern.exec(tab.url);


        document.getElementById("info").style.display = "block";
        var elements = document.getElementsByClassName('defaultBtn');
        var length = elements.length;
        for (var i = 0; i < length; i++) {
            elements[i].style.display = 'none';
        }

        if (edgeId !== null && edgeId[1] !== null) {
            document.getElementById("info").style.display = "none";
            document.getElementById('downloadCRX').style.display = 'block';
        } else if (id !== null && id[1] !== null) {
            document.getElementById("info").style.display = "none";
            var elements = document.getElementsByClassName('defaultBtn');
            var length = elements.length;
            for (var i = 0; i < length; i++) {
                elements[i].style.display = 'block';
            }
        }
    });
}
ready();