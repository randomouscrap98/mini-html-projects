// randomouscrap98
// 12-15-2020

var system = 
{
   name: "journal",
   version: "0.5.2_f2" //format 2
};

var globals = 
{
   roomdata: "",
   roomname: "",
   preamble: {},
   chatpointer: 0,
   drawpointer: 0,
   drawer: null,
   context: null,
   maxPage : 0,
   pendingStroke: {},
   scheduledLines: [],
   scheduledScrolls: []
};

var constants =
{
   pwidth : 1000,
   pheight : 8000,
   roomPrepend : "journal_",
   settingPrepend : "mini_journal_",
   messageLengthBytes : 2,
   maxLines : 5000,        //A single stroke (or fill) can't have more than this
   maxMessageRender : 100, //per frame
   maxScan : 5000,         //per frame
};

var symbols = 
{
   text : "~",
   stroke : "|",
   lines : "-",
   cap : "'"
};

window.onload = function()
{
   try
   {
      setupComputedConstants();

      var url = new URL(location.href);

      if(!globals.roomname)
         globals.roomname = constants.roomPrepend + url.searchParams.get("room");

      if(url.searchParams.get("export") == 1)
      {
         performExport(globals.roomname);
         return;
      }

      setupToggleSetting("pageflip", pageflip, 
         () => document.body.setAttribute("data-flipped", ""),
         () => document.body.removeAttribute("data-flipped"));
      setupToggleSetting("pagechat", pagechat, 
         () => show(chat),
         () => hide(chat));

      setupPageControls();
      setupValueLinks(document);   
      setupRadioEmulators(document);
      setupClosable(document);
      setupStaticExport();

      HTMLUtilities.SimulateScrollbar(scrollbar, scrollbarbar, scrollblock, true);
      globals.context = drawing.getContext("2d");

      if(!document.body.hasAttribute("data-export"))
      {
         if(!globals.roomname)
         {
            show(noroomscreen);
            return;
         }

         setupColorControls();
         setupExport(document.getElementById("export"));
         setupChat();
         globals.drawer = setupDrawer(drawing);
         drawtoggle.oninput = (e) => setDrawAbility(globals.drawer, drawing, drawtoggle.checked);

         pullInitialStream(() =>
         {
            //DON'T start the frame function until we have the initial stream, this isn't an export!
            enable(sidebar);
            startLongPoller();
            frameFunction(); 
         });
      }
      else
      {
         //Exported, disable some stuff and don't set up listeners/etc. Can
         //instantly setup the frame function!
         frameFunction();
         enable(sidebar);
         refreshInfo();
      }
   }
   catch(ex)
   {
      alert("Exception during load: " + ex.message);
   }
};

function safety(func) { try { func(); } catch(ex) { console.log(ex); } }
function getSetting(name) { return StorageUtilities.ReadLocal(constants.settingPrepend + name) }
function setSetting(name, value) { StorageUtilities.WriteLocal(constants.settingPrepend + name, value); }
function setStatus(status) { percent.setAttribute("data-status", status); }
function getPlaybackSpeed() { 
   return Number(playbacktext.value) * 
      Number(playbackmodifier.querySelector("[data-selected]").id.replace("playback",""));
}
function getPageNumber() { return Number(pagenumber.textContent) - 1; }
function setPageNumber(v) { pagenumber.textContent = v+1; }
function getLineSize() 
{ 
   return Number(sizetext.value) *
      Number(sizemodifier.querySelector("[data-selected]").id.replace("size",""));
}
function getLineColor() { return colortext.value; }
function setLineColor(color) { colortext.value = color; doValueLink(colortext); }
function getTool() { return tools.querySelector("[data-selected]").id.replace("tool_", ""); }
function isDropperActive() { return dropper.hasAttribute("data-selected"); }
function setDropperActive(active) 
{ 
   if(active) { dropper.setAttribute("data-selected",""); } 
   else { dropper.removeAttribute("data-selected"); }
}

function setupComputedConstants()
{
   constants.messageHeaderLength = 1 + constants.messageLengthBytes;
}

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

function setupColorControls()
{
   dropper.onclick = () => setDropperActive(!isDropperActive()) ;
}

function setupRadioEmulators(element)
{
   [...element.querySelectorAll("[data-radio]")].forEach(x =>
   {
      [...x.children].forEach(y => (y.onclick = () => HTMLUtilities.SimulateRadioSelect(y, x)));
   });
}

function setupClosable(element)
{
   [...element.querySelectorAll("[data-closeable]")].forEach(x =>
   {
      var closebutton = document.createElement("button");
      closebutton.innerHTML = "&#10005;";
      closebutton.className = "closebutton";
      closebutton.onclick = () => hide(x);
      x.appendChild(closebutton);
   });
}

function exportSinglePage(page, tracker)
{
   var context = buffer1.getContext("2d");
   CanvasUtilities.Clear(buffer1); //, "#FFF");
   tracker.drawpointer = 0;
   tracker.scheduledLines = [];
   processLines(tracker, Number.MAX_SAFE_INTEGER, page, Number.MAX_SAFE_INTEGER);
   drawLines(tracker.scheduledLines, context);
   //Need this so images are saved with backgrounds.
   CanvasUtilities.SwapColor(context, new Color(0,0,0,0), new Color(255,255,255,1), 0);
   return buffer1.toDataURL();
}

function setupStaticExport()
{
   var cbutt = exportstaticscreen.querySelector(".closebutton");
   var activeUrl = null;
   cbutt.addEventListener("click", () => 
   {
      if(activeUrl)
      {
         console.log("Releasing download blob");
         window.URL.revokeObjectURL(activeUrl);
         activeUrl = null;
      }
   });
   
   exportstatic.onclick = (e) =>
   {
      e.preventDefault();
      exportstaticcontainer.innerHTML = "Loading, please wait...";
      show(exportstaticscreen);

      //It will never be higher than 8000 (I think)
      var htmlexport = document.implementation.createHTMLDocument();
      htmlexport.body.innerHTML = `
<meta charset="UTF-8">
<style>
body { width: 1700px; font-family: sans-serif; margin: 8px; padding: 0; }
.pane { display: inline-block; margin: 0 10px; padding: 0; vertical-align: top;}
#textbox { width: 600px; background-color: #FCFCFC; } 
#imagebox > * { display: block; }
#infobox { background: #F7F7F7; padding: 10px; margin-bottom: 15px; }
#infobox h3 { margin-top: 0; }
#imagebox img { image-rendering: moz-crisp-edges; image-rendering: crisp-edges;
   image-rendering: optimizespeed; image-rendering: pixelated; }
.pageid { background: #F3F3F3; padding: 5px; border-radius: 5px; 
   padding-left: 10px; }
.username { font-weight: bold; }
.username::after { content: ":"; }
.wholemessage { padding: 1px 3px; }
.striped:nth-child(even) { background-color: #F7F7F7; }
.exported { color: #777; font-size: 0.8em; display: block; margin: 7px 0 3px 0;
   font-style: italic; }
</style>
<div id="leftpane" class="pane">
   <div id="imagebox"></div>
</div>
<div id="rightpane" class="pane">
   <div id="infobox">
      <h3>${globals.roomname}</h3>
      <time>${globals.preamble.date}</time>
      <time class="exported">Exported: ${(new Date()).toISOString()}</time>
   </div>
   <div id="textbox"></div>
</div>`;

      var textbox = htmlexport.getElementById("textbox");
      var imagebox = htmlexport.getElementById("imagebox");

      //Have to do this repeat parsing in order to reduce memory usage.
      var tracker = { maxPage : 0, chatpointer : 0 };
      var page = 0;
      var ready = true;

      var wait = setInterval(() =>
      {
         if(ready)
         {
            ready = false;
            var pageURI = exportSinglePage(page++, tracker);
            var pageID = document.createElement("a");
            pageID.id = "page_" + page;
            pageID.className = "pageid";
            pageID.innerHTML = "Page " + page;
            pageID.href = "#" + pageID.id;
            imagebox.appendChild(pageID);
            var image = document.createElement("img");
            image.setAttribute('src', pageURI);
            imagebox.appendChild(image);
            exportstaticcontainer.innerHTML += "<br>Page " + page;
            ready = true;
         }

         if(page > tracker.maxPage)
         {
            clearInterval(wait);

            var msgs = processMessages(tracker, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            msgs.forEach(x => textbox.appendChild(createMessageElement(x)));

            //Be done with it
            var htmlBlob = new Blob([htmlexport.documentElement.outerHTML], {type:"text/plain;charset=utf-8"});
            activeUrl = URL.createObjectURL(htmlBlob);
            var downloadLink = document.createElement("a");
            downloadLink.textContent = "Download HTML";
            downloadLink.href = activeUrl;
            downloadLink.download = globals.roomname + ".html";
            downloadLink.style.display = "block";
            exportstaticcontainer.appendChild(downloadLink);
         }
      }, 100);
   };
}

function setDrawAbility(drawer, canvas, ability)
{
   if(ability)
   {
      drawer.Attach(canvas);
      canvas.setAttribute("data-drawactive", "");
   }
   else
   {
      drawer.Detach();
      canvas.removeAttribute("data-drawactive");
   }
}

function setupScrollTest()
{
   var ctx = drawing.getContext("2d");
   ctx.font = "10px Arial";
   for(var i = 0; i < constants.pheight; i += 100)
      ctx.fillText(String(i), 10, i);
   for(var i = 0; i < constants.pwidth; i += 100)
      ctx.fillRect(i, 0, 1, constants.pwidth);
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

function setupPageControls()
{
   pagebackward.onclick = () => changePage(-1);
   pageforward.onclick = () => changePage(1);
}

//This might be a dumb function idk
function changePage(increment)
{
   globals.drawpointer = 0;
   globals.scheduledLines = [];
   setPageNumber(getPageNumber() + increment);
   CanvasUtilities.Clear(drawing);

   if(getPageNumber() <= 0)
      pagebackward.setAttribute("data-disabled", "");
   else
      pagebackward.removeAttribute("data-disabled");
}


function setupChat()
{
   var form = $("#messageform");
   enterSubmits($("#message"), form);

   form.submit(function()
   {
      post(endpoint(globals.roomname), createMessageChunk(username.value, message.value));
      message.value = "";
      return false;
   });
}

function setupDrawer(canvas)
{
   var drawer = new CanvasPerformer();
   attachBasicDrawerAction(drawer);
   setDrawAbility(drawer, canvas, true);
   CanvasUtilities.Clear(canvas);
   return drawer;
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
      alert("Export complete! You can now save this webpage (in Chrome, you select 'Webpage, Complete' in the dialog). Depending on the browser, this page may not function until you save and open it locally.");
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
   if(data)
   {
      percenttext.innerHTML = (100 * (data.used / data.limit)).toFixed(2) + "%";
      percentbar.style.width = (75 * data.used / data.limit) + "px";
   }

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

//Scan data starting at start until func returns true or data ends
function dataScan(start, func, maxScan)
{
   //always skip preamble
   if(start < globals.preamble.skip)
      start = globals.preamble.skip;

   maxScan = maxScan || constants.maxScan;
   var current = start;
   var clength = 0;
   var scanned = 0;
   var cc;

   //Now start looping
   while(true)
   {
      if(current >= globals.roomdata.length || scanned > maxScan)
         return;

      cc = globals.roomdata.charAt(current);

      if(cc == symbols.text)
      {
         clength = 1 + constants.messageLengthBytes + 
            StreamConvert.CharsToInt(globals.roomdata, current + 1, constants.messageLengthBytes);
      }
      else if(cc == symbols.stroke || cc == symbols.lines)
      {
         clength = globals.roomdata.indexOf(symbols.cap, current) - current + 1;
      }
      else
      {
         console.error("Unrecoverable data error! Unknown character in stream!");
         return;
      }

      if(clength <= 0)
         clength = globals.roomdata.length - current;

      if(func(current, clength, cc))
         return;
      
      current += clength;
      scanned++;
   }
}

//For now, the big function that generates the generic "lines" the journal
//uses. The journal doesn't care about alpha or aliasing or any of that, it
//only draws collections of pixel perfect lines.
function generatePendingLines(drw, pending)
{
   //If the pending stroke isn't active, activate it (since they're asking for generation)
   if(!pending.active)
   {
      pending.active = true;
      pending.accepting = true;
      pending.size = getLineSize();
      pending.tool = getTool();
      pending.page = getPageNumber();
      pending.color = pending.tool == "eraser" ? null : getLineColor();
      pending.lines = [];
   }

   var currentLines = [];

   //There are times when an active stroke will not accept new lines (because
   //it's too long or something, for instance a huge flood fill)
   if(pending.accepting)
   {
      //Simple stroke
      if(pending.tool == "eraser" || pending.tool == "pen")
      {
         pending.type = symbols.stroke;
         currentLines.push(new MiniDraw.LineData(pending.size, pending.color,
            Math.round(drw.lastX), Math.round(drw.lastY), 
            Math.round(drw.currentX), Math.round(drw.currentY)));
      }
      //Complex big boy fill
      else if(pending.tool == "fill")
      {
         pending.type = symbols.lines;
         pending.size = 1;
         pending.accepting = false; //DON'T do any more fills on this stroke!!
         flood(drw, currentLines, pending.color);
      }

      //if the amount of lines we're about to add is too much, remove from the
      //current lines
      if(pending.lines.length + currentLines.length > constants.maxLines)
      {
         console.warn("Too many lines! Pending: ", pending.lines.length, " Next: ", currentLines.length);
         currentLines.splice(constants.maxLines - pending.lines.length);
         pending.accepting = false;
      }

      pending.lines = pending.lines.concat(currentLines);
   }

   return currentLines;
}

function copyToBackbuffer(canvas)
{
   var context = buffer1.getContext("2d");
   CanvasUtilities.CopyInto(context, canvas);
   return context;
}

function flood(drw, currentLines, color)
{
   //Do the east/west thing, generate the lines, IGNORE future strokes
   //Using a buffer because working with image data can (does) cause it to go
   //into software rendering mode, which is very slow
   var context = copyToBackbuffer(drw._canvas);
   var width = buffer1.width;
   var height = buffer1.height;
   var iData = context.getImageData(0, 0, width, height);
   var img = iData.data;
   var queue = [[Math.round(drw.currentX), Math.round(drw.currentY)]];
   var rIndex = MiniDraw.GetIndex(iData, drw.currentX, drw.currentY);
   var replaceColor = [img[rIndex], img[rIndex+1], img[rIndex+2], img[rIndex+3]];
   console.log("Flood into color: ", replaceColor, drw.currentX, drw.currentY);
   var west, east, i, j;
   var shouldFill = (x, y) =>
   {
      if(x < 0 || y < 0 || x >= width || y >= height)
         return false;
      var i = MiniDraw.GetIndex(iData, x, y);
      return img[i] == replaceColor[0] && img[i + 1] == replaceColor[1] &&
         img[i + 2] == replaceColor[2] && img[i + 3] == replaceColor[3];
   };
   while(queue.length)
   {
      var p = queue.pop();
      if(shouldFill(p[0],p[1]))
      {
         //March left until not should fill, march right
         for(west = p[0] - 1; west >= 0 && shouldFill(west, p[1]); west--);
         for(east = p[0] + 1; west < width && shouldFill(east, p[1]); east++);

         //Bring them back in range
         west++; east--;

         currentLines.push(new MiniDraw.LineData(1, color, west, p[1], east, p[1]));

         //Don't allow huge fills at all, just quit
         if(currentLines.length > constants.maxLines)
         {
            alert("Flood fill area too large!");
            currentLines.length = 0;
            break;
         }

         //Now travel from west to east, adding all pixels (we check later anyway)
         for(i = west; i <= east; i++)
         {
            //Just has to be DIFFERENT, not the color we're filling.
            j = MiniDraw.GetIndex(iData, i, p[1]);
            img[j + 3] = (img[j + 3] + 10) & 255;
            //Queue the north and south (regardless of fill requirement)
            queue.push([i, p[1] + 1]);
            queue.push([i, p[1] - 1]);
         }
      }
   }

   iData = null;
   img = null;
   console.log("Flood lines: ", currentLines.length);
}

function createMessageChunk(username, message)
{
   var m = username + ": " + message;
   var max = StreamConvert.MaxValue(constants.messageLengthBytes);
   if(m.length > max)
      m = m.substr(0, max);
   return symbols.text + StreamConvert.IntToChars(m.length, constants.messageLengthBytes) + m;
}

function createStandardPoint(x, y, extra)
{
   return StreamConvert.IntToChars((extra ? 1 : 0) + ((x & 1023) << 1) + ((y & 8191) << 11), 4);
}

function createColorData(color)
{
   return StreamConvert.IntToChars(parseInt((color || "#000000").replace("#", "0x")),4);
}

//Consider moving some of this out of here so the line data portion (the
//"payload" so to speak) can be abstracted away from the idea of pages? but why?
function createLineData(pending)
{
   var result = pending.type + StreamConvert.IntToVariableWidth(pending.page);

   if(pending.type == symbols.stroke)
   {
      //lowest bit erase, next 10 x, next 13 y of START point
      result += createStandardPoint(pending.lines[0].x1, pending.lines[0].y1, pending.color) +
         StreamConvert.IntToChars(pending.size, 1);

      if(pending.color)
         result += createColorData(pending.color);

      var lastx = pending.lines[0].x1;
      var lasty = pending.lines[0].y1;
      var ofsx, ofsy;

      //Now do all relative points until we run out
      for(var i = 0; i < pending.lines.length; i++)
      {
         if(pending.lines[i].x1 != lastx || pending.lines[i].y1 != lasty)
         {
            //Oof, we have to stop and recurse!
            console.warn("Stroke break, recursing at ", i);
            pending.lines.splice(0, i);
            return result + symbols.cap + createLineData(pending);
         }

         ofsx = pending.lines[i].x2 - lastx;
         ofsy = pending.lines[i].y2 - lasty;

         result += 
            StreamConvert.IntToVariableWidth(StreamConvert.SignedToSpecial(ofsx)) +
            StreamConvert.IntToVariableWidth(StreamConvert.SignedToSpecial(ofsy));

         lastx = pending.lines[i].x2;
         lasty = pending.lines[i].y2;
      }
   }
   else if(pending.type == symbols.lines)
   {
      result += createColorData(pending.color) +
         StreamConvert.IntToChars(pending.size, 1);

      //And now, just all the line data as-is (literally);
      pending.lines.forEach(x => result += 
         createStandardPoint(x.x1, x.y1, x.color) +
         createStandardPoint(x.x2, x.y2, x.color));
   }
   else
   {
      throw "Unknown pending lines type!";
   }

   return result + symbols.cap;
}

function parseStandardPoint(data, start)
{
   var header = StreamConvert.CharsToInt(data, start, 4);
   return { x : (header >> 1) & 1023, y : (header >> 11) & 8191, extra : header & 1,
      length : 4 };
}

function parseColorData(data, start)
{
   return "#" + StreamConvert.CharsToInt(data, start, 4).toString(16).toUpperCase().padStart(6, "0");
}

//Get a collection of lines from the given data. Assume start starts at actual
//line data and not page/type/etc (type is given)
function parseLineData(data, start, length, type)
{
   var i, l = 0, x, y, t, t2, result = [];

   if(type == symbols.stroke)
   {
      //Remember, start is at line payload, length doesn't include cap
      var point = parseStandardPoint(data, start);
      var segment = [ point.x, point.y ];
      var color = false;
      var size = StreamConvert.CharsToInt(data, start + point.length, 1);
      l += point.length + 1;

      if(point.extra)
      {
         color = parseColorData(data, start + l);
         l += 4;
      }

      while(l < length)
      {
         t = StreamConvert.VariableWidthToInt(data, start + l);
         l += t.length;
         t2 = segment[segment.length - 2] + StreamConvert.SpecialToSigned(t.value);
         segment.push(t2);
      }

      if(segment.length % 2)
      {
         //As often as possible. try to recover from errors.
         console.error("Dangling point on parsed stroke!");
         segment.pop();
      }

      if(segment.length < 2)
      {
         console.error("Parsed stroke too short!");
         return result;
      }

      //Duplicate the last point in case it doesn't line up nicely
      if(segment.length < 4)
      {
         x = segment[0];
         y = segment[1]
         segment.push(x, y);
      }

      //Now generate the lines
      for(i = 0; i < segment.length - 2; i += 2)
      {
         result.push(new MiniDraw.LineData(size, color, 
            segment[i], segment[i + 1], segment[i + 2], segment[i + 3]));
      }

   }
   else if(type == symbols.lines)
   {
      var color = parseColorData(data, start);
      var size = StreamConvert.CharsToInt(data, start + 4, 1);
      l += 5;

      //This one is actually simpler, it's just blobs of lines
      for(i = start + l; i < start + length; i += 8)
      {
         t = parseStandardPoint(data, i);
         t2 = parseStandardPoint(data, i + 4);
         result.push(new MiniDraw.LineData(size, t.extra ? color : null, 
            t.x, t.y, t2.x, t2.y));
      }
   }
   else
   {
      throw "Unparseable data type " + type;
   }

   return result;
}

function drawLines(lines, context, overridecolor) 
{ 
   context = context || globals.context;
   lines.forEach(x => 
   {
      if(overridecolor)
         x.color = overridecolor;
      MiniDraw.SimpleLine(context, x);
   });
   return lines; 
}

function frameFunction()
{
   if(globals.scheduledScrolls.length > 0)
   {
      globals.scheduledScrolls.forEach(x => x.scrollTop = x.scrollHeight);
      globals.scheduledScrolls = [];
   }

   //First, perform self-lines
   if(globals.drawer)
   {
      drawLocal(globals.drawer, globals.pendingStroke);

      //Post lines when we're done (why is this in the frame drawer again?)
      if(!globals.drawer.currentlyDrawing && globals.pendingStroke.active)
      {
         if(globals.pendingStroke.lines.length > 0)
         {
            var ldata = createLineData(globals.pendingStroke);
            post(endpoint(globals.roomname), ldata, () => setStatus("ok"), () => setStatus("error"));
            //console.log("Stroke complete: " + ldata);
            //drawLines(parseLineData(ldata, 2, ldata.length - 3, ldata.charAt(0)), "#FF0000");
         }
         globals.pendingStroke.active = false;
      }
   }

   var msgs = processMessages(globals, constants.maxMessageRender);
   
   if(msgs.length > 0)
   {
      var fragment = new DocumentFragment();
      msgs.forEach(x => fragment.appendChild(createMessageElement(x)));
      messages.appendChild(fragment);
      globals.scheduledScrolls.push(messagecontainer);
   }

   //The incoming draw data handler
   var pbspeed = getPlaybackSpeed();
   processLines(globals, pbspeed, getPageNumber());

   //Now draw lines based on playback speed (if there are any)
   if(globals.scheduledLines.length > 0)
      drawLines(globals.scheduledLines.splice(0, pbspeed));

   requestAnimationFrame(frameFunction);
}

function drawLocal(drawer, pending)
{
   if(drawer.currentX !== null)
   {
      if(isDropperActive())
      {
         doDropper(drawer.currentX, drawer.currentY);

         //This is a lot just to stop the stroke
         drawer.ignoreStroke = true;
         drawer.currentX = null;
      }
      else
      {
         drawLines(generatePendingLines(drawer, pending));

         //These are NOT performed every frame because the drawing events are
         //NOT synchronized to the frame, so we could be removing that very
         //important "lastX lastY" data
         drawer.lastX = drawer.currentX;
         drawer.lastY = drawer.currentY;
         drawer.currentX = null;
         drawer.currentY = null;
      }
   }
}

function doDropper(x, y)
{
   var ctx = copyToBackbuffer(globals.drawer._canvas);
   var color = CanvasUtilities.GetColor(ctx, x, y);
   console.log("Dropper: ", color);

   //Don't activate the dropper on non-colors
   if(color.a)
   {
      setLineColor(color.ToHexString());
      setDropperActive(false);
   }
}

//The message handler
function processMessages(tracker, max, scanLimit)
{
   var messages = []; 

   dataScan(tracker.chatpointer, (start, length, cc) =>
   {
      tracker.chatpointer = start + length;

      if(cc != symbols.text)
         return;

      messages.push(parseMessage(globals.roomdata.substr(
         start + constants.messageHeaderLength, length - constants.messageHeaderLength)));

      return messages.length > max;
   }, scanLimit);

   return messages;
}

function processLines(tracker, limit, page, scanLimit)
{
   dataScan(tracker.drawpointer, (start, length, cc) =>
   {
      tracker.drawpointer = start + length;

      //We only handle certain things in draw
      if(cc != symbols.lines && cc != symbols.stroke)
         return;

      //We ALSO only handle the draw if it's the right PAGE.
      var pageDat = StreamConvert.VariableWidthToInt(globals.roomdata, start + 1);

      if(pageDat.value > tracker.maxPage)
         tracker.maxPage = pageDat.value;

      if(pageDat.value != page)
         return;

      //Parse the lines, draw them, and update the line count all in one
      //(drawLines returns the lines again)
      tracker.scheduledLines = tracker.scheduledLines.concat(
         parseLineData(globals.roomdata, start + 1 + pageDat.length, length - pageDat.length - 2, cc));

      return tracker.scheduledLines.length > limit;
   }, scanLimit);
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

function createMessageElement(parsed)
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

