

let extensionURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
function ready () {
    document.getElementById('downloadZIP').onclick = function(){
        chrome.runtime.getBackgroundPage(function (bg) {
            bg.download("zip");
        });
    };
    document.getElementById('downloadCRX').onclick = function () {
        chrome.runtime.getBackgroundPage(function (bg) {
            bg.download("crx");
        });
    };
    document.getElementById('rating').onclick = function () {
        window.open("https://chrome.google.com/webstore/detail/crx-extractordownloader/ajkhmmldknmfjnmeedkbkkojgobmljda/reviews");
    };
    chrome.tabs.getSelected(null, function (tab) {
        var id = extensionURLPattern.exec(tab.url);
        if(id===null||id[1]===null){
            document.getElementById("info").style.display="block";
            var elements = document.getElementsByClassName('buttons');
            var length = elements.length;
            for (var i = 0; i < length; i++) {
                elements[i].style.display = 'none';
            } 
        }else{
            document.getElementById("info").style.display = "none";
            var elements = document.getElementsByClassName('buttons');
            var length = elements.length;
            for (var i = 0; i < length; i++) {
                elements[i].style.display = 'block';
            } 
        }
    });
}
ready();