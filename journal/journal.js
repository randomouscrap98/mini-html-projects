// 12-15-2020

var system = 
{
   name: "journal",
   version: "0.1.0"
};

function toolData(tool, size, color) {
   this.tool = tool;    //"none";
   this.size = size;    //0;
   this.color = color;  //"#XXXXXX";
}

window.onload = function()
{
   setupValueLinks(document);   
   setupRadioEmulators(document);
   setupToggleSetting("pageflip", pageflip, 
      () => document.body.setAttribute("data-flipped", ""),
      () => document.body.removeAttribute("data-flipped"));
   setupToggleSetting("pagechat", pagechat, 
      () => chat.removeAttribute("data-hidden"),
      () => chat.setAttribute("data-hidden", ""));

   HTMLUtilities.SimulateScrollbar(scrollbar, scrollbarbar, scrollblock, false);

   setupScrollTest();
};

function getSetting(name) { return StorageUtilities.ReadLocal("mini_journal_" + name) }
function setSetting(name, value) { StorageUtilities.WriteLocal("mini_journal_" + name, value); }

function setupValueLinks(element)
{
   [...element.querySelectorAll("[data-link]")].forEach(x => (x.oninput = e => doValueLink(e.target)) );
}

function doValueLink(target)
{
   var linked = target.getAttribute("data-link");
   var update = document.getElementById(linked);
   update.value = target.value;
}

function setupRadioEmulators(element)
{
   [...element.querySelectorAll("[data-radio]")].forEach(x =>
   {
      [...x.children].forEach(y => (y.onclick = () => HTMLUtilities.SimulateRadioSelect(y, x)));
   });
}

function setupScrollTest()
{
   var ctx = drawing.getContext("2d");
   for(var i = 0; i < 16000; i += 100)
      ctx.fillText(i, 10, i);
}

function setupToggleSetting(name, checkbox, checktrue, checkfalse)
{
   var change = e => {
      setSetting(name, checkbox.checked);
      if(checkbox.checked)
         checktrue(checkbox, name);
      else
         checkfalse(checkbox, name);
   };
   checkbox.oninput = change;
   checkbox.checked = getSetting(name);
   change();
}

function setupFlip(flipper)
{
}

function setupChat(thechat, chatelement)
{
   var chatchange = e => {
      setSetting("pagechat", thechat.checked);
      if(thechat.checked)
         chatelement.removeAttribute("data-hidden");
      else
         chatelement.setAttribute("data-hidden", "");
   };
   thechat.oninput = chatchange;

   if(getSetting("pagechat"))
   {
      flipper.checked = true;
      flipchange();
   }
}
