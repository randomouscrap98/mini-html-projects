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
   system.rawTool = CanvasUtilities.DrawSolidSquareLine;
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

   //Now setup some elements or whatever.
   //Setting up controls puts everything in the controls in a "ready" state.
   setupPalette($("#palette"), function(v) 
   { 
      system.color = v;  //Note: we store INDEX instead of color like drawer expects, probably fine!
   });
   $("#download")[0].addEventListener("click", function(e)
   {
      e.target.href = drawing[0].toDataURL();
      e.target.download = system.room + "_" + (Math.floor(new Date().getTime()/1000)) + ".png";
   }, false);
   $("#swapside").click(function()
   {
      $("body > .inline").toggleClass("right");
      return false;
   });
   $("#newroom").attr("href", randomRoomLink());

   //Page turner
   var updatePage = function(amount)
   {
      var newPage = ((pNum.data("page") || 0) + amount + 36) % 36;
      drawing.css("left", (-600 * (newPage % 6)) + "px");
      drawing.css("top", (-600 * Math.floor(newPage / 6)) + "px");
      pNum.data("page", newPage);
      pNum.text("Page " + (newPage + 1).toString().padStart(2, '0'));
   };

   pDown.click(function() {updatePage(-1);});
   pUp.click(function() {updatePage(1);});
});

//black, gray, light gray, white
//red, pink, purple, blue
//light blue, cyan, green, light green, 
//yellow, orange, brown, tan
var palette = [
   "rgb(0,0,0)", "rgb(87,87,87)", "rgb(160,160,160)", "rgb(255,255,255)",
   "rgb(173,35,35)", "rgb(255,205,243)", "rgb(129,38,192)", "rgb(42,75,215)",
   "rgb(157,175,255)", "rgb(41,208,208)", "rgb(29,105,20)", "rgb(129,197,122)", 
   "rgb(255,238,51)", "rgb(255,146,51)", "rgb(129,74,25)", "rgb(233,222,187)"];
var charStart = 48;
var lineBytes = 10;

function intToChars(int, chars)
{
   chars = chars || 1;
   var max = ((1 << (chars * 6)) - 1);

   if(int < 0) int = 0;
   if(int > max) int = max;

   var result = "";

   for(var i = 0; i < chars; i++)
      result += String.fromCharCode(charStart + ((int >> (i * 6)) & 63));

   return result;
}

function charsToInt(chars, start, count)
{
   start = start || 0;
   count = count || chars.length - start;
   var result = 0;
   for(var i = 0; i < count; i++)
      result += (chars.charCodeAt(i + start) - charStart) << (i * 6);
   return result;
}

function pxCh(int) { return intToChars(int + 16, 2); }
function chPx(char, offset) { return charsToInt(char, offset, 2) - 16; }

function tryParseMessage(data, i)
{
   if(data.charAt(i) === "(")
   {
      var l = charsToInt(data, i + 1, 2); //12 bits (2 chars) for message length
      var result = {};
      result.shift = l + 3;
      result.full = data.substring(i + 3, i + 3 + l);
      var colon = result.full.indexOf(":");
      if(colon >= 0)
      {
         result.username = result.full.substr(0, colon + 1);
         result.message = result.full.substr(colon + 1);
      }
      return result;
   }

   return null;
}

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

//Draw a converted action on the given context. Can index into larger actions,
//or just draw the whole item given.
function drawData(rawTool, context, line, o)
{
   o = o || 0;
   context.fillStyle = palette[charsToInt(line, o + 9, 1) % palette.length];
   return rawTool(context, 
      chPx(line, o), chPx(line, o + 2), chPx(line, o + 4), chPx(line, o + 6), 
      charsToInt(line, o + 8, 1));
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

   function frameDraw()
   {
      frameCounter++;
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

      drawReceiveCount = Math.ceil(system.receivedLines.length / (60 * lineBytes));

      for(var i = 0; i < drawReceiveCount; i++)
         drawData(system.rawTool, system.context, system.receivedLines, i * lineBytes);

      system.receivedLines = system.receivedLines.substr(drawReceiveCount * lineBytes);

      if(frameCounter >= 20 && system.lines.length > 0)
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

   drawer.OnAction = function(data, context)
   {
      //DON'T actually do anything. Just store the data for laters.
      if(data.onTarget && (data.action & CursorActions.Drag) > 0)
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
   };

   canvas[0].width = 3600;
   canvas[0].height = 3600;

   drawer.Attach(canvas[0]);
   CanvasUtilities.Clear(canvas[0], palette[3]); //palette[3] is the white color (hopefully)

   return drawer;
}

function randomRoomLink()
{
   return window.location.href.split('?')[0] + "?" + Math.random().toString().substr(2);
}

