
$(document).on("click",function(){
    loadImage();
});
$(document).ready(function(){
   setTimeout(function(){
console.log("herer")
    loadImage();
   },500);
})
function loadImage(){
    var element=$(".irc_c");
    if(element){
        var loop;
        setTimeout(function(){
        for(loop=0;loop<element.length;loop++){
            var currentElement=$(element[loop]);
            if(currentElement.css("transform")==="matrix(1, 0, 0, 1, 0, 0)"){
               var img= currentElement.find(".irc_mi");
               var src=img.attr("src");
             
               var aTag=$("<a/>",{
                   target:"_blank",
                   href:src
               });
               var table=currentElement.find(".irc_but_r");
               var span=$("<span/>");
               span.text("View Image");
               aTag.append(span);
               var td=$("<td/>",{
                   id:"jsViewImageButton"
               });
               $("#jsViewImageButton").remove();
               td.append(aTag);
               table.find("tr").append(td);
            }
       
    }
},400);
    }
}