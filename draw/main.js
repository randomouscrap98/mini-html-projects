// Carlos Sanchez
// January, 2020

var system = 
{
   version: "1.4.2"
};

$(document).ready(function()
{
   setupStyling();

   var controls = $("#controls");
   var pControls = $("#palette");
   var drawing = $("#drawing");
   var lineSlider = $("#lineSlider");
   var lineNumber = $("#lineNumber");
   var context = drawing[0].getContext("2d");
   var pDown = $("#pagedown");
   var pUp = $("#pageup");
   var exp = $("#export");

   //Special
   var percent = $("#percent");
   var stat = $("#status");
   var statusindicator = $("#statusindicator");

   //Chat elements
   var chatForm = $("#mainform");
   var mContainer = $("#messageContainer");
   var messages = $("#messages");
   var message = $("#message");
   var username = $("#username");
   
   var isReadonly = location.hash == "#readonly";

   //SUPER initial setup
   drawing[0].width = totalWidth;
   drawing[0].height = totalHeight;
   CanvasUtilities.Clear(drawing[0], palette[clearIndex]);

   //Boring "enter to yeah"
   if(!isReadonly)
   {
      enterSubmits(message, chatForm);

      chatForm.submit(function()
      {
         post(endpoint(system.room), createMessageChunk(username.val(), message.val()));
         message.val("");
         return false;
      });
   }
   else
   {
      hide(pControls[0]);
      hide(chatForm[0]);
      hide(document.getElementById("line"));
      system.drawer = {}; //Don't allow ANY drawer
   }

   //Setup main system
   system.signaled = new Queue(20);
   system.lines = [];
   system.receivedLines = [];
   system.receivedIndex = 0;
   system.room = system.room || window.location.search.substr(1);
   system.rawTool = drawSimpleLine;
   system.drawer = system.drawer || createBaseDrawer(drawing); //, 3600, 3600);
   system.context = context;
   system.frameDraw = setupFrameDraw(system);

   lineSlider.on("input", function()
   {
      var v = lineSlider.val();
      lineNumber.text(v);
      system.lineWidth = v;
   });

   setSlider(lineSlider, 3);

   //Query initial data (and continue querying)
   stat.text("Loading...");

   queryEnd(system.room, 0, function(data, start)
   {
      setRunning(statusindicator);

      //automatically parse data and push lines + messages to appropriate places
      processRaw(data.data, 
         function(parsed) { system.receivedLines.push(parsed); }, 
         function(parsed)
         {
            messages.append(createMessageElement(parsed));
            mContainer[0].scrollTop = mContainer[0].scrollHeight;
         });

      percent.text((data.used / data.limit * 100).toFixed(2) + "%");
      readonlylink.href=`?${data.readonlykey}#readonly`;
      readonlylink.textContent = `#${data.readonlykey}`;
      system.signaled.Enqueue(data.signalled);
      statusindicator.text(Math.ceil(system.signaled.Average()));

      stat.text("");

      //Oops, we went over the export limit. Fix this one day!
      if(data.used > 1480000)
         exp.addClass("disabled");

      return data.datalength;
   }, function() { setError(statusindicator); }, isReadonly);

   //Start the system
   system.frameDraw();

   system.fileName = system.fileName || function() { 
      return system.room + "_" + (Math.floor(new Date().getTime()/1000)); };

   //Now setup some elements or whatever.
   //Setting up controls puts everything in the controls in a "ready" state.
   setupPalette(pControls, function(v) 
   { 
      pControls.css("background-color", palette[v]);
      system.color = v;  //Note: we store INDEX instead of color like drawer expects, probably fine!
   });
   $("#download")[0].addEventListener("click", function(e)
   {
      e.target.href = drawing[0].toDataURL();
      e.target.download = system.fileName() + ".png";
   }, false);
   $("#download1")[0].addEventListener("click", function(e)
   {
      e.target.href = getPageCanvas(system.rawPageData, drawing[0]).toDataURL();
      e.target.download = system.fileName() + "_" + system.page + ".png";
   }, false);
   exp.click("click", function()
   {
      var js, html, data, css, minicss;
      exp.addClass("disabled");
      var finalize = function()
      {
         if(!(js && html && data && css && minicss)) return;
         exp.removeClass("disabled");
         var fin = html.replace(/%DRAWJS%/g, js)
                       .replace(/%DRAWCSS%/g, css)
                       .replace(/%MINICSS%/g, minicss)
                       .replace(/%ROOMNAME%/g, system.room)
                       .replace(/%RAWDATA%/g, JSON.stringify(data));
         var dl = $('<a>Download Export!</a>');
         dl.attr("href","data:text/plain;charset=utf-8;base64," + Base64.encode(fin));
         dl.attr("download", system.fileName() + ".html");
         dl.click(function() { dl.remove(); });
         $("#data").append(dl);
      };
      //Note: this does NOT show errors if anything errors out!
      $.get(endpoint(system.room, isReadonly), function(d) { data = d; finalize(); });
      $.get("export.html", function(d) { html = d; finalize(); });
      $.get("draw.js", function(d) { js = d; finalize(); });
      $.get("main.css", function(d) { css = d; finalize(); });
      $.get("../mini.css", function(d) { minicss = d; finalize(); });
   });
   $("#swapside").click(function()
   {
      $("body").toggleClass("right");
      return false;
   });
   $("#newroom").attr("href", randomRoomLink());

   //Page turner
   var myUpdatePage = function(amount)
   {
      var result = updatePage(system.page, amount);
      drawing.css("left", result.left);
      drawing.css("top", result.top);
      system.page = result.page;
      system.offsetLeft = result.leftRaw;
      system.offsetTop = result.topRaw;
      system.rawPageData = result;
      $("#pagenum").text(result.pageText);
   };

   pDown.click(function() {myUpdatePage(-1);});
   pUp.click(function() {myUpdatePage(1);});
   myUpdatePage(0); //This sets up all the page values.

   messages.append($('<div class="version">Version ' + system.version + '</div>'));
});

function createMessageChunk(username, message)
{
   var m = username + ": " + message + "\n";
   return "(" + intToChars(Math.min(m.length, 4000), 2) + m;
}

function setupPalette(controls, paletteFunc)
{
   controls.empty();
   var radios = new RadioSimulator(controls[0], "data-index", paletteFunc);
   var paletteBlock
   for(var i = 0; i < palette.length; i++)
   {
      if(i % 16 === 0)
      {
         paletteBlock = $("<div></div>");
         paletteBlock.addClass("inline");
         paletteBlock.addClass("inert");
         controls.append(paletteBlock);
      }

      var radio = $(radios.CreateRadioButton("", i));
      radio.css("background-color", palette[i]);
      paletteBlock.append(radio);
   }
   radios.SelectRadio("1");
}

function setupStyling()
{
   var st = StyleUtilities.CreateStyleElement();
   StyleUtilities.InsertStylesAtTop([st]);
   st.Append(["canvas"], StyleUtilities.NoImageInterpolationRules());
}

function setupFrameDraw(system)
{
   var drw = system.drawer;
   var frameCounter = 0;
   var drawReceiveCount = 0;
   var drawAccumulator = 0;

   function frameDraw()
   {
      //First, perform self-lines
      if(drw.currentX !== null)
      {
         var line = new LineData(system.lineWidth, system.color,
            Math.round(drw.lastX), Math.round(drw.lastY), 
            Math.round(drw.currentX), Math.round(drw.currentY));
         
         system.lines.push(line);
         system.rawTool(system.context, line);

         //These are NOT performed every frame because the drawing events are
         //NOT synchronized to the frame, so we could be removing that very
         //important "lastX lastY" data
         drw.lastX = drw.currentX;
         drw.lastY = drw.currentY;
         drw.currentX = null;
         drw.currentY = null;
      }

      //Then, perform received lines (could also be our own lol)
      if(system.receivedLines.length > system.receivedIndex)
      {
         drawAccumulator += Math.max(0.5, 
            Math.pow(system.receivedLines.length - system.receivedIndex, 1.2) / 120);
         drawReceiveCount = Math.floor(drawAccumulator);
      
         //Only draw lines if... we've accumulated enough
         if(drawReceiveCount > 0)
         {
            for(var i = 0; i < drawReceiveCount; i++) 
               system.rawTool(system.context, system.receivedLines[system.receivedIndex + i]);
            
            //Get rid of what we drew from the accumulator
            drawAccumulator -= drawReceiveCount;
            system.receivedIndex += drawReceiveCount;
         }
      }
      else
      {
         //If we've reached the END of the lines, clear out the array. This
         //should reduce the number of arrays created significantly, since, as
         //long as data keeps coming, we'll keep buffering the lines in the
         //same array. Only when everything gets quiet do we create a new one.
         system.receivedLines = [];
         system.receivedIndex = 0;
      }

      //While we have pending lines, keep track of frames. We only care about
      //frames to post these lines anyway.
      if(system.lines.length > 0)
         frameCounter++;

      //Post your lines every half a second. Probably ok...
      if(frameCounter >= 30)
      {
         post(endpoint(system.room), createOptimizedLines(system.lines));
         system.lines = [];
         frameCounter = 0;
      }

      requestAnimationFrame(frameDraw);
   }

   return frameDraw;
}

function createBaseDrawer(canvas) //, width, height)
{
   var drawer = new CanvasPerformer();

   drawer.currentX = null;
   drawer.currentY = null;

   var ignore;
   var lastOffTarget = false;

   drawer.OnAction = function(data, context)
   {
      if(data.action & CursorActions.Interrupt)
         ignore = true;

      //If you're drawing on the canvas by dragging and we don't want to ignore
      //this line, store the position for later (animation frames pick it up)
      if(data.onTarget && (data.action & CursorActions.Drag) > 0 && !ignore)
      {
         if(data.action & CursorActions.Start || lastOffTarget)
         {
            drawer.lastX = data.x;
            drawer.lastY = data.y;
         }

         //console.log("DRAG", data.x, data.y);
         //Always store current position.
         drawer.currentX = data.x;
         drawer.currentY = data.y;
      }

      lastOffTarget = !data.onTarget;

      //If you're ending a drag and not interrupting (meaning a TRUE drag end),
      //we can stop ignoring the stroke. Honestly though, the performer should
      //keep track of a like "stroke id" for us. Consider doing this.
      if ((data.action & (CursorActions.Drag | CursorActions.End | CursorActions.Interrupt)) == 
         (CursorActions.End | CursorActions.Drag))
         ignore = false;
   };

   drawer.Attach(canvas[0]);
   canvas.attr("data-drawable", "");

   return drawer;
}

function randomRoomLink()
{
   return window.location.href.split('?')[0] + "?" + Math.random().toString().substr(2);
}

