// 12-15-2020

var system = 
{
   name: "journal",
   version: "0.1.0_f1" //format 1
};

var globals = 
{
   roomdata: "",
   roomname: "",
   preamble: {}
};

function toolData(tool, size, color) {
   this.tool = tool;    //"none";
   this.size = size;    //0;
   this.color = color;  //"#XXXXXX";
}

window.onload = function()
{
   try
   {
      var url = new URL(location.href);

      if(!globals.roomname)
         globals.roomname = url.searchParams.get("room");

      if(url.searchParams.get("export") == 1)
         performExport(globals.roomname);

      setupToggleSetting("pageflip", pageflip, 
         () => document.body.setAttribute("data-flipped", ""),
         () => document.body.removeAttribute("data-flipped"));
      setupToggleSetting("pagechat", pagechat, 
         () => show(chat),
         () => hide(chat));

      if(!document.body.hasAttribute("data-export"))
      {
         if(!globals.roomname)
         {
            show(noroomscreen);
            return;
         }

         setupValueLinks(document);   
         setupRadioEmulators(document);
         setupExport(document.getElementById("export"));

         HTMLUtilities.SimulateScrollbar(scrollbar, scrollbarbar, scrollblock, false);

         setupScrollTest();

         //Go out and get initial data. If it's empty, we alert to creating the
         //new data, then reload the page (it's just easier). Otherwise, we
         //pull the (maybe huge) initial blob 
         $.getJSON(endpoint(globals.roomname) + "/json?nonblocking=true")
            .done(data =>
            {
               if(data.used == 0)
               {
                  if(confirm("This appears to be a brand new journal, are you sure you want to create one here?"))
                  {
                     //POST the preamble and move on to reload
                     post(endpoint(globals.roomname), createPreamble(system.name, system.version), d => location.reload());
                     return;
                  }
               }
               else
               {
                  globals.roomdata = data.data;
                  globals.preamble = parsePreamble(globals.roomdata);

                  if(!(globals.preamble && globals.preamble.version && globals.preamble.version.endsWith("f1")))
                  {
                     show(incompatibleformatscreen);
                     return;
                  }

                  refreshInfo(data);
                  enable(sidebar);
               }

            })
            .fail(data =>
            {
               show(initialchunkfailscreen);
            });
      }
      else
      {
         //Exported, load data from attribute.
      }
   }
   catch(ex)
   {
      alert("Exception during load: " + ex.message);
   }
};

function getSetting(name) { return StorageUtilities.ReadLocal("mini_journal_" + name) }
function setSetting(name, value) { StorageUtilities.WriteLocal("mini_journal_" + name, value); }
function safety(func) { try { func(); } catch(ex) { console.log(ex); } }

//Perform initial setup that's ALWAYS done regardless of load type (export/etc)
//function alwaysSetup() { }

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
   ctx.font = "10px Arial";
   for(var i = 0; i < 16000; i += 100)
      ctx.fillText(String(i), 10, i);
}

function setupToggleSetting(name, checkbox, checktrue, checkfalse)
{
   var change = e => {
      safety(() => setSetting(name, checkbox.checked));
      if(checkbox.checked)
         checktrue(checkbox, name);
      else
         checkfalse(checkbox, name);
   };
   checkbox.oninput = change;
   safety(() => checkbox.checked = getSetting(name));
   change();
}

function setupExport(exp)
{
   var url = new URL(location.href);
   url.searchParams.set("export", "1");
   exp.href = url.toString();
}

function performExport(room)
{
   //First, throw up the cover screen
   show(exportscreen);

   //Then, go download all the header stuff and jam them into their respective elements
   var styles = document.head.querySelectorAll('link[rel="stylesheet"]');
   var scripts = document.head.querySelectorAll('script');

   var data, stylesLeft = styles.length, scriptsLeft = scripts.length;

   var finalize = () =>
   {
      console.log(scriptsLeft, stylesLeft);
      if(!(data && stylesLeft == 0 && scriptsLeft == 0)) return;

      document.body.setAttribute("data-export", "");
      hide(exportscreen);
      alert("Export complete! You can now save this webpage (in Chrome, you select 'Webpage, Complete' in the dialog).");
   };

   $.get(endpoint(room), function(d) { data = d; finalize(); });
   [...styles].forEach(x =>
   {
      $.get(x.href, d =>
      { 
         var s = document.createElement("style");
         s.innerHTML = d;
         document.head.appendChild(s);
         x.parentNode.removeChild(x);
         stylesLeft--;
         finalize(); 
      });
   });
   [...scripts].forEach(x =>
   {
      $.get(x.src, d =>
      { 
         if(x.src.indexOf("journal.js") >= 0)
         {
            console.log("MATCH: ", x.src);
            d = d.replace('roomname: ""', 'roomname: ' + JSON.stringify(room))
               .replace('roomdata: ""', 'roomdata: ' + JSON.stringify(data));
         }

         x.innerHTML = d;
         x.removeAttribute("src");
         scriptsLeft--;
         finalize(); 
      });
   });
}

function refreshInfo(data)
{
   percent.innerHTML = (100 * (data.used / data.limit)).toFixed(2) + "%";
}
