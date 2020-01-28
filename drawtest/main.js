//Yeah
$(document).ready(function()
{
   var room = window.location.search.substr(1);

   var st = StyleUtilities.CreateStyleElement();
   StyleUtilities.InsertStylesAtTop([st]);
   st.Append(["canvas"], StyleUtilities.NoImageInterpolationRules());

   var status = $("#status");
   var drawing = $("#drawing");
   var context = drawing[0].getContext("2d");

   var drawer = new CanvasDrawer();
   var nTool = new CanvasDrawerTool(networkTool);
   nTool.frameLock = 1;
   drawer.tools["network"] = nTool;
   drawer.currentTool = "network";
   drawer.lineWidth = 3;

   var canvas = drawing[0];
   canvas.width = 600;
   canvas.height = 600;

   drawer.Attach(canvas, [], 0);

   queryEnd(room, 0, function(data)
   {
      //messages.append(document.createTextNode(data));
      //container[0].scrollTop = container[0].scrollHeight;
      if(data.length > 10000)
         displayError("Loading " + data.length + " bytes...", status)
         
      drawLines(data, context);

      if(data.length > 10000)
         status.empty();

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

var currentColor = 0; //Don't use this!
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
      intToChars(data.lineWidth, 1) + intToChars(currentColor, 1);
   lines += line;
   return drawData(func, context, line);
}

function drawData(func, context, line, o)
{
   o = o || 0;
   return func(context, 
      chPx(line, o), chPx(line, o + 2), chPx(line, o + 4), chPx(line, o + 6), 
      charsToInt(line, o + 8, 1));
}

function drawLines(lines, context)
{
   //var oldStyle = context.fillStyle;
   //context.fillStyle = "red";
   //CanvasUtilities.Clear(context.canvas);
   //console.log('cleared, lines: ' + lines.length);
   for(var i = 0; i < lines.length; i+= 10)
      drawData(func, context, lines, i);
   //console.log('done?');
   //context.fillStyle = oldStyle;
}
