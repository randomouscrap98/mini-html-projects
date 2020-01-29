// Carlos Sanchez
// January, 2020

var system = {};

$(document).ready(function()
{
   setupStyling();

   var controls = $("#controls");
   var percent = $("#percent");
   var stat = $("#status");
   var drawing = $("#drawing");
   var lineSlider = $("#lineSlider");
   var lineNumber = $("#lineNumber");
   var context = drawing[0].getContext("2d");
   var pDown = $("#pagedown");
   var pUp = $("#pageup");
   var pNum = $("#pagenum");

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
      var m = username.val() + ": " + message.val() + "\n";
      var text = "(" + intToChars(Math.min(m.length, 4000), 2) + m;
      post(endpoint(system.room), text);
      message.val("");
      return false;
   });

   system.lines = "";
   system.room = window.location.search.substr(1);
   system.rawTool = CanvasUtilities.DrawSolidSquareLine;
   system.drawer = createBaseDrawer(function(dt, ct, dr)
   {
      var line = convertAction(dt);
      system.lines += line;
      return drawData(system.rawTool, ct, line);
   });

   //Setting up controls puts everything in the controls in a "ready" state.
   setupPalette($("#palette"), function(v) 
   { 
      system.drawer.color = v;  //Note: we store INDEX instead of color like drawer expects, probably fine!
   });
   $("#download")[0].addEventListener("click", function(e)
   {
      e.target.href = drawing[0].toDataURL();
      e.target.download = system.room + "_" + (Math.floor(new Date().getTime()/1000)) + ".png";
   }, false);
   lineSlider.on("input", function()
   {
      var v = lineSlider.val();
      lineNumber.text(v);
      system.drawer.lineWidth = v;
   });

   lineSlider.val(3);
   lineSlider.trigger("input");

   var canvas = drawing[0];
   canvas.width = 3600;
   canvas.height = 3600;

   system.drawer.Attach(canvas, [], 0);
   CanvasUtilities.Clear(canvas, palette[3]);

   queryEnd(system.room, 0, function(data, start)
   {
      if(data.length > 10000) stat.text("Loading " + data.length + " bytes...");

      var parsed;

      for(var i = 0; i < data.length; i+= 10)
      {
         //First, always check for chat messages
         parsed = tryParseMessage(data, i);

         //If there's chat, put it in. Otherwise keep drawing.
         if(parsed)
         {
            messages.append(document.createTextNode(parsed.message));
            mContainer[0].scrollTop = mContainer[0].scrollHeight;
            i += parsed.shift - 10;
         }
         else
         {
            drawData(system.rawTool, context, data, i);
         }
      }

      percent.text((Math.max(start,data.length)/50000).toFixed(2) + "%");

      if(data.length > 10000) stat.text("");

      return data.length;
   });

   setInterval(function()
   {
      if(system.lines)
      {
         post(endpoint(system.room), system.lines);
         system.lines = "";
      }
   }, 100);

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

//Convert action data (and extras) to line data
function convertAction(data)
{
   return pxCh(data.oldX) + pxCh(data.oldY) + pxCh(data.x) + pxCh(data.y) +
      intToChars(data.lineWidth, 1) + intToChars(data.color, 1);
}

function tryParseMessage(data, i)
{
   if(data.charAt(i) === "(")
   {
      var l = charsToInt(data, i + 1, 2); //12 bits (2 chars) for message length
      message = data.substring(i + 3, i + 3 + l);
      return { shift: 3 + l, message: message};
   }

   return null;
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

function createBaseDrawer(toolFunc)
{
   var drawer = new CanvasDrawer();
   var nTool = new CanvasDrawerTool(toolFunc);
   nTool.frameLock = 1;
   drawer.tools["network"] = nTool;
   drawer.currentTool = "network";
   return drawer;
}
