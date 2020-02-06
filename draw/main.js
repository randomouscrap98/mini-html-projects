// Carlos Sanchez
// January, 2020

var system = {};

$(document).ready(function()
{
   setupStyling();

   var controls = $("#controls");
   var drawing = $("#drawing");
   var lineSlider = $("#lineSlider");
   var lineNumber = $("#lineNumber");
   var context = drawing[0].getContext("2d");
   var pDown = $("#pagedown");
   var pUp = $("#pageup");
   var pNum = $("#pagenum");

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

   //Boring "enter to yeah"
   enterSubmits(message, chatForm);

   chatForm.submit(function()
   {
      post(endpoint(system.room), createMessageChunk(username.val(), message.val()));
      message.val("");
      return false;
   });

   //Setup main system
   system.signaled = new Queue(20);
   system.lines = "";
   system.receivedLines = "";
   system.room = window.location.search.substr(1);
   system.rawTool = drawSimpleLine;
   system.drawer = createBaseDrawer(drawing, 3600, 3600);
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

      var parsed;
      var d = data.data;

      for(var i = 0; i < d.length; i+= lineBytes)
      {
         //First, always check for chat messages
         parsed = tryParseMessage(d, i);

         //If there's chat, put it in. Otherwise keep drawing.
         if(parsed)
         {
            messages.append(createMessageElement(parsed));
            mContainer[0].scrollTop = mContainer[0].scrollHeight;
            i += parsed.shift - lineBytes;
         }
         else
         {
            system.receivedLines += d.substring(i, i + lineBytes);
         }
      }

      percent.text((data.used / data.limit * 100).toFixed(2) + "%");
      system.signaled.Enqueue(data.signalled);
      statusindicator.text(Math.ceil(system.signaled.Average()));
      stat.text("");

      return d.length;
   }, function() { setError(statusindicator); });

   //Start the system
   system.frameDraw();

   system.fileName = function() { return system.room + "_" + (Math.floor(new Date().getTime()/1000)); };

   //Now setup some elements or whatever.
   //Setting up controls puts everything in the controls in a "ready" state.
   setupPalette($("#palette"), function(v) 
   { 
      system.color = v;  //Note: we store INDEX instead of color like drawer expects, probably fine!
   });
   $("#download")[0].addEventListener("click", function(e)
   {
      e.target.href = drawing[0].toDataURL();
      e.target.download = system.fileName() + ".png";
   }, false);
   $("#export").click("click", function()
   {
      var js, html, data;
      var btn = $(this);
      btn.addClass("disabled");
      var finalize = function()
      {
         if(!(js && html && data)) return;
         btn.removeClass("disabled");
         var fin = html.replace("%DRAWJS%", js).replace("%RAWDATA%", JSON.stringify(data));
         var dl = $("<a>Download Export!</a>");
         dl.attr("href","data:text/plain;charset=utf-8;base64," + btoa(fin));
         dl.attr("download", system.fileName() + ".html");
         dl.click(function() { dl.remove(); });
         stat.append(dl);
      };
      //Note: this does NOT show errors if anything errors out!
      $.get(endpoint(system.room), function(d) { data = d; finalize(); });
      $.get("export.html", function(d) { html = d; finalize(); });
      $.get("draw.js", function(d) { js = d; finalize(); });
   });
   $("#swapside").click(function()
   {
      $("body > .inline").toggleClass("right");
      return false;
   });
   $("#newroom").attr("href", randomRoomLink());

   //Page turner
   var myUpdatePage = function(amount)
   {
      var result = updatePage(pNum.data("page"), amount);
      drawing.css("left", result.left);
      drawing.css("top", result.top);
      pNum.data("page", result.page);
      pNum.text(result.pageText);
   };

   pDown.click(function() {myUpdatePage(-1);});
   pUp.click(function() {myUpdatePage(1);});
});

function createMessageChunk(username, message)
{
   var m = username + ": " + message + "\n";
   return "(" + intToChars(Math.min(m.length, 4000), 2) + m;
}

function createMessageElement(parsed)
{
   var msg = parsed.full;
   var msgelem = $("<div></div>");
   msgelem.addClass("message");

   if(parsed.username)
   {
      var username = $("<span></span>");
      username.addClass("username");
      username.text(parsed.username);
      msgelem.append(username);
      msg = parsed.message;
   }

   msgelem.append(document.createTextNode(msg));
   return msgelem;
}

function setupPalette(controls, paletteFunc)
{
   controls.empty();
   var radios = new RadioSimulator(controls[0], "data-index", paletteFunc);
   for(var i = 0; i < palette.length; i++)
   {
      var radio = $(radios.CreateRadioButton("", i));
      radio.css("background-color", palette[i]);
      controls.append(radio);
   }
   radios.SelectRadio("0");
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
      if(system.drawer.currentX !== null)
      {
         var line = pxCh(drw.lastX) + pxCh(drw.lastY) + pxCh(drw.currentX) + pxCh(drw.currentY) +
            intToChars(system.lineWidth, 1) + intToChars(system.color, 1);

         system.lines += line;

         drawData(system.rawTool, system.context, line);

         drw.lastX = drw.currentX;
         drw.lastY = drw.currentY;
         drw.currentX = null;
         drw.currentY = null;
      }

      if(system.receivedLines.length > 0)
      {
         drawAccumulator += Math.max(0.5, 
            Math.pow(system.receivedLines.length, 1.169) / (120 * lineBytes));
         drawReceiveCount = Math.floor(drawAccumulator);
      
         //Only draw lines if... we've accumulated enough
         if(drawReceiveCount > 0)
         {
            for(var i = 0; i < drawReceiveCount; i++) 
               drawData(system.rawTool, system.context, system.receivedLines, i * lineBytes);
            
            //Get rid of what we drew from the accumulator
            drawAccumulator -= drawReceiveCount;
            system.receivedLines = system.receivedLines.substr(drawReceiveCount * lineBytes);
         }
      }

      //While we have pending lines, keep track of frames. We only care about
      //frames to post these lines anyway.
      if(system.lines.length > 0)
         frameCounter++;

      if(frameCounter >= 30)
      {
         post(endpoint(system.room), system.lines);
         system.lines = "";
         frameCounter = 0;
      }

      requestAnimationFrame(frameDraw);
   }

   return frameDraw;
}

function createBaseDrawer(canvas, width, height)
{
   var drawer = new CanvasPerformer();

   drawer.currentX = null;
   drawer.currentY = null;

   var ignore;

   drawer.OnAction = function(data, context)
   {
      if(data.action & CursorActions.Interrupt)
         ignore = true;

      //If you're drawing on the canvas by dragging and we don't want to ignore
      //this line, store the position for later (animation frames pick it up)
      if(data.onTarget && (data.action & CursorActions.Drag) > 0 && !ignore)
      {
         if(data.action & CursorActions.Start)
         {
            drawer.lastX = data.x;
            drawer.lastY = data.y;
         }

         //Always store current position.
         drawer.currentX = data.x;
         drawer.currentY = data.y;
      }

      //If you're ending a drag and not interrupting (meaning a TRUE drag end),
      //we can stop ignoring the stroke. Honestly though, the performer should
      //keep track of a like "stroke id" for us. Consider doing this.
      if ((data.action & (CursorActions.Drag | CursorActions.End | CursorActions.Interrupt)) == 
         (CursorActions.End | CursorActions.Drag))
         ignore = false;
   };

   canvas[0].width = totalWidth;
   canvas[0].height = totalHeight;

   drawer.Attach(canvas[0]);
   CanvasUtilities.Clear(canvas[0], palette[3]); //palette[3] is the white color (hopefully)

   return drawer;
}

function randomRoomLink()
{
   return window.location.href.split('?')[0] + "?" + Math.random().toString().substr(2);
}

