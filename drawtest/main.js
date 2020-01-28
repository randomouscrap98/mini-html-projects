// Carlos Sanchez
// January, 2020

$(document).ready(function()
{
   var room = window.location.search.substr(1);

   var st = StyleUtilities.CreateStyleElement();
   StyleUtilities.InsertStylesAtTop([st]);
   st.Append(["canvas"], StyleUtilities.NoImageInterpolationRules());

   var controls = $("#controls");
   var percent = $("#percent");
   var stat = $("#status");
   var drawing = $("#drawing");
   var lineSlider = $("#lineSlider");
   var lineNumber = $("#lineNumber");
   var context = drawing[0].getContext("2d");

   var drawer = new CanvasDrawer();
   var nTool = new CanvasDrawerTool(networkTool);
   nTool.frameLock = 1;
   drawer.tools["network"] = nTool;
   drawer.currentTool = "network";

   //Setting up controls puts everything in the controls in a "ready" state.
   setupPalette($("#palette"), function(v) { drawer.currentColor = v; });
   $("#download")[0].addEventListener("click", function(e)
   {
      e.target.href = drawing[0].toDataURL();
      e.target.download = room + "_" + (Math.floor(new Date().getTime()/1000)) + ".png";
   }, false);
   lineSlider.on("input", function()
   {
      var v = lineSlider.val();
      lineNumber.text(v);
      drawer.lineWidth = v;
   });

   lineSlider.val(3);
   lineSlider.trigger("input");

   var canvas = drawing[0];
   canvas.width = 600;
   canvas.height = 600;

   drawer.Attach(canvas, [], 0);
   CanvasUtilities.Clear(drawing[0], palette[3]);

   queryEnd(room, 0, function(data, start)
   {
      //messages.append(document.createTextNode(data));
      //container[0].scrollTop = container[0].scrollHeight;
      if(data.length > 10000)
         stat.text("Loading " + data.length + " bytes...");
         
      drawLines(data, context);
      percent.text((Math.max(start,data.length)/50000) + "%");

      if(data.length > 10000)
         stat.text("");

      return data.length;
   });

   setInterval(function()
   {
      if(lines)
      {
         post(endpoint(room), lines);
         lines = "";
      }
   }, 100);
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

var lines = "";
var func = CanvasUtilities.DrawSolidSquareLine;

function networkTool(data, context, drawer)
{
   var line = pxCh(data.oldX) + pxCh(data.oldY) + pxCh(data.x) + pxCh(data.y) +
      intToChars(data.lineWidth, 1) + intToChars(drawer.currentColor, 1);
   lines += line;
   return drawData(func, context, line);
}

function drawData(func, context, line, o)
{
   o = o || 0;
   context.fillStyle = palette[charsToInt(line, o + 9, 1) % palette.length];
   return func(context, 
      chPx(line, o), chPx(line, o + 2), chPx(line, o + 4), chPx(line, o + 6), 
      charsToInt(line, o + 8, 1));
}

function drawLines(lines, context)
{
   for(var i = 0; i < lines.length; i+= 10)
      drawData(func, context, lines, i);
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

