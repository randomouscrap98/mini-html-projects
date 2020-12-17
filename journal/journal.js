// 12-15-2020

var system = 
{
   name: "journal",
   version: "0.1.1_f2" //format 2
};

var globals = 
{
   roomdata: "",
   roomname: "",
   preamble: {},
   chatpointer: 0,
   drawpointer: 0,
   scheduledScrolls: []
};

var constants =
{
   roomPrepend : "journal_",
   settingPrepend : "mini_journal_",
   messageLengthBytes : 2,
   maxMessageRender : 100, //per frame
   maxStrokeRender : 1000, //per frame
};

var symbols = 
{
   text : "~",
   stroke : "|",
   lines : "-",
   cap : "'"
};

function toolData(tool, size, color, page) {
   this.tool = tool;    //"none";
   this.size = size;    //0;
   this.color = color;  //"#XXXXXX";
   this.page = page;    //
}

window.onload = function()
{
   try
   {
      setupComputedConstants();

      var url = new URL(location.href);

      if(!globals.roomname)
         globals.roomname = constants.roomPrepend + url.searchParams.get("room");

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
         setupChat();

         HTMLUtilities.SimulateScrollbar(scrollbar, scrollbarbar, scrollblock, false);

         setupScrollTest();

         pullInitialStream(() =>
         {
            //DON'T start the frame function until we have the initial stream, this isn't an export!
            startLongPoller();
            frameFunction(); 
         });
      }
      else
      {
         //Exported, disable some stuff and don't set up listeners/etc. Can
         //instantly setup the frame function!
         frameFunction();
      }
   }
   catch(ex)
   {
      alert("Exception during load: " + ex.message);
   }
};

function getSetting(name) { return StorageUtilities.ReadLocal(constants.settingPrepend + name) }
function setSetting(name, value) { StorageUtilities.WriteLocal(constants.settingPrepend + name, value); }
function safety(func) { try { func(); } catch(ex) { console.log(ex); } }
function setStatus(status) { percent.setAttribute("data-status", status); }

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
   for(var i = 0; i < 8000; i += 100)
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

function setupComputedConstants()
{
   constants.messageHeaderLength = 1 + constants.messageLengthBytes;
}

function setupChat()
{
   var form = $("#messageform");
   enterSubmits($("#message"), form);

   form.submit(function()
   {
      post(endpoint(globals.roomname), newMessageChunk(username.value, message.value));
      message.value = "";
      return false;
   });
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

   var stylesLeft = styles.length, scriptsLeft = scripts.length;

   var finalize = () =>
   {
      console.log(scriptsLeft, stylesLeft);
      if(!(stylesLeft == 0 && scriptsLeft == 0)) return;

      document.body.setAttribute("data-export", "");
      hide(exportscreen);
      alert("Export complete! You can now save this webpage (in Chrome, you select 'Webpage, Complete' in the dialog).");
   };

   $.get(endpoint(room), data => 
   { 
      //Scripts MUST come AFTER data (since we need to insert it INTO a script)
      [...scripts].forEach(x =>
      {
         $.get(x.src, d =>
         { 
            if(x.src.indexOf("journal.js") >= 0)
            {
               console.log("MATCH: ", x.src);
               var preamble = parsePreamble(data);
               d = d.replace('roomname: ""', 'roomname: ' + JSON.stringify(room))
                  .replace('roomdata: ""', 'roomdata: ' + JSON.stringify(data))
                  .replace('preamble: {}', 'preamble: ' + JSON.stringify(preamble));
            }

            x.innerHTML = d;
            x.removeAttribute("src");
            scriptsLeft--;
            finalize(); 
         });
      });

      //This won't do anything, but we should always make sure...
      //what if there are NO scripts and NO styles?
      finalize(); 
   });

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
}

function refreshInfo(data)
{
   percent.innerHTML = (100 * (data.used / data.limit)).toFixed(2) + "%";
   version.innerHTML = system.version;
}

function pullInitialStream(continuation)
{
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
               post(endpoint(globals.roomname), 
                  createPreamble(system.name, system.version), // + newPageString(), 
                  d => location.reload());
               return;
            }
         }
         else
         {
            globals.preamble = parsePreamble(data.data);

            if(!(globals.preamble && globals.preamble.version && globals.preamble.name == system.name &&
               globals.preamble.version.endsWith("f2")))
            {
               show(incompatibleformatscreen);
               return;
            }

            handleIncomingData(data);
            enable(sidebar);

            if(continuation) 
               continuation();
         }

      })
      .fail(data =>
      {
         show(initialchunkfailscreen);
      });
}

function startLongPoller()
{
   queryEnd(globals.roomname, globals.roomdata.length, (data, start) =>
   {
      handleIncomingData(data);
      return data.data.length;
   }, () =>
   { 
      setStatus("error");
   });
}


function handleIncomingData(data)
{
   globals.roomdata += data.data;
   setStatus("ok");
   refreshInfo(data);
}

function newMessageChunk(username, message)
{
   var m = username + ": " + message;
   var max = StreamConvert.MaxValue(constants.messageLengthBytes);
   if(m.length > max)
      m = m.substr(0, max);
   return symbols.text + StreamConvert.IntToChars(m.length, constants.messageLengthBytes) + m;
}

//Scan data starting at start until func returns true or data ends
function dataScan(start, func)
{
   //always skip preamble
   if(start < globals.preamble.skip)
      start = globals.preamble.skip;

   var current = start;
   var clength = 0;
   var cc;

   //Now start looping
   while(true)
   {
      if(current >= globals.roomdata.length)
         return;

      cc = globals.roomdata.charAt(current);

      if(cc == symbols.text)
      {
         clength = 1 + constants.messageLengthBytes + 
            StreamConvert.CharsToInt(globals.roomdata, current + 1, constants.messageLengthBytes);
      }
      else if(cc == symbols.stroke || cc == symbols.lines)
      {
         clength = globals.roomdata.indexOf(symobls.cap, current);
      }
      else
      {
         console.log("Unrecoverable data error! Unknown character in stream!");
         return;
      }

      if(clength <= 0)
         clength = globals.roomdata.length - current;

      if(func(current, clength, cc))
         return;
      
      current += clength;
   }
}

function frameFunction()
{
   if(globals.scheduledScrolls.length > 0)
   {
      globals.scheduledScrolls.forEach(x => x.scrollTop = x.scrollHeight);
      globals.scheduledScrolls = [];
   }

   //First, perform self-lines
   //if(drw.currentX !== null)
   //{
   //   var line = new LineData(system.lineWidth, system.color,
   //      Math.round(drw.lastX), Math.round(drw.lastY), 
   //      Math.round(drw.currentX), Math.round(drw.currentY));
   //   
   //   system.lines.push(line);
   //   system.rawTool(system.context, line);

   //   //These are NOT performed every frame because the drawing events are
   //   //NOT synchronized to the frame, so we could be removing that very
   //   //important "lastX lastY" data
   //   drw.lastX = drw.currentX;
   //   drw.lastY = drw.currentY;
   //   drw.currentX = null;
   //   drw.currentY = null;
   //}

   ////Then, perform received lines (could also be our own lol)
   //if(system.receivedLines.length > system.receivedIndex)
   //{
   //   drawAccumulator += Math.max(0.5, 
   //      Math.pow(system.receivedLines.length - system.receivedIndex, 1.2) / 120);
   //   drawReceiveCount = Math.floor(drawAccumulator);
   //
   //   //Only draw lines if... we've accumulated enough
   //   if(drawReceiveCount > 0)
   //   {
   //      for(var i = 0; i < drawReceiveCount; i++) 
   //         system.rawTool(system.context, system.receivedLines[system.receivedIndex + i]);
   //      
   //      //Get rid of what we drew from the accumulator
   //      drawAccumulator -= drawReceiveCount;
   //      system.receivedIndex += drawReceiveCount;
   //   }
   //}
   //else
   //{
   //   //If we've reached the END of the lines, clear out the array. This
   //   //should reduce the number of arrays created significantly, since, as
   //   //long as data keeps coming, we'll keep buffering the lines in the
   //   //same array. Only when everything gets quiet do we create a new one.
   //   system.receivedLines = [];
   //   system.receivedIndex = 0;
   //}


   //The message handler
   var totalMessages = 0;
   var messagesFragment;

   dataScan(globals.chatpointer, (start, length, cc) =>
   {
      if(cc != symbols.text)
         return;

      //A small optimization so we're not creating a document fragment every frame
      if(!messagesFragment)
         messagesFragment = new DocumentFragment();

      messagesFragment.appendChild(createMessageElement(parseMessage(
         globals.roomdata.substr(start + constants.messageHeaderLength, length - constants.messageHeaderLength))));

      globals.chatpointer = start + length;

      return ++totalMessages > constants.maxMessageRender;
   });

   if(totalMessages > 0)
   {
      messages.appendChild(messagesFragment);
      globals.scheduledScrolls.push(messagecontainer);
   }

   requestAnimationFrame(frameFunction);
}

function parseMessage(fullMessage)
{
   var colon = fullMessage.indexOf(":");
   var result = { username : "???", message : fullMessage };

   if(colon >= 0)
   {
      result.username = fullMessage.substr(0, colon);
      result.message = fullMessage.substr(colon + 1);
   }

   return result;
}

function createMessageElement(parsed) //start, length, cc)
{
   var msgelem = document.createElement("span");
   msgelem.className = "message";
   msgelem.textContent = parsed.message;

   var username = document.createElement("span");
   username.className = "username";
   username.textContent = parsed.username;

   var msgcontainer = document.createElement("div");
   msgcontainer.className = "striped wholemessage";
   msgcontainer.appendChild(username);
   msgcontainer.appendChild(msgelem);

   return msgcontainer;
}

//function newPageString()
//{
//   var pageData = { date : (new Date()).toISOString() };
//   var pdatastr = JSON.stringify(pageData);
//   return symbols.newpage + StreamConvert.IntToChars(pdatastr.length, 2) + pdatastr;
//}
