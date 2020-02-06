
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
var pageWidth = 600;
var pageHeight = 600;
var pagesX = 6;
var pagesY = 6;
var pagesTotal = pagesX * pagesY;
var totalWidth = pageWidth * pagesX;
var totalHeight = pageHeight * pagesY;

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

//The draw system is paged, always (basically). And even if it isn't, you don't
//HAVE to use this function!
function updatePage(existing, amount)
{
   var newPage = ((existing || 0) + amount + pagesTotal) % pagesTotal;

   return {
      "left": (-600 * (newPage % pagesX)) + "px",
      "top": (-600 * Math.floor(newPage / pagesX)) + "px",
      "page": newPage,
      "pageText": "Page " + (newPage + 1).toString().padStart(Math.ceil(Math.log10(pagesTotal)), '0')
   };
}

function drawSimpleLine(ctx, x1, y1, x2, y2, width)
{
   var xdiff = x2 - x1;
   var ydiff = y2 - y1;
   var dist = Math.sqrt(xdiff*xdiff+ydiff*ydiff);
   var ang = Math.atan(ydiff/(xdiff===0?0.0001:xdiff))+(xdiff<0?Math.PI:0); 
   var ofs = (width - 1) / 2;

   if(dist === 0) dist=0.001;

   for(var i=0;i<dist;i+=0.5) 
      ctx.fillRect(Math.round(x1+Math.cos(ang)*i-ofs), Math.round(y1+Math.sin(ang)*i-ofs), width, width);
}

