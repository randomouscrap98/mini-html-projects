
//black, gray, light gray, white
//red, pink, purple, blue
//light blue, cyan, green, light green, 
//yellow, orange, brown, tan
var palette = [
   "#ff0040", "#131313", "#1b1b1b", "#272727",
   "#3d3d3d", "#5d5d5d", "#858585", "#b4b4b4",
   "#ffffff", "#c7cfdd", "#92a1b9", "#657392",
   "#424c6e", "#2a2f4e", "#1a1932", "#0e071b",

   "#1c121c", "#391f21", "#5d2c28", "#8a4836",
   "#bf6f4a", "#e69c69", "#f6ca9f", "#f9e6cf",
   "#edab50", "#e07438", "#c64524", "#8e251d",
   "#ff5000", "#ed7614", "#ffa214", "#ffc825",

   "#ffeb57", "#d3fc7e", "#99e65f", "#5ac54f",
   "#33984b", "#1e6f50", "#134c4c", "#0c2e44",
   "#00396d", "#0069aa", "#0098dc", "#00cdf9",
   "#0cf1ff", "#94fdff", "#fdd2ed", "#f389f5",

   "#db3ffd", "#7a09fa", "#3003d9", "#0c0293",
   "#03193f", "#3b1443", "#622461", "#93388f",
   "#ca52c9", "#c85086", "#f68187", "#f5555d",
   "#ea323c", "#c42430", "#891e2b", "#571c27"
];

var charStart = 48;
var lineBytes = 10;
var pageWidth = 600;
var pageHeight = 600;
var pagesX = 6;
var pagesY = 6;
var pagesTotal = pagesX * pagesY;
var totalWidth = pageWidth * pagesX;
var totalHeight = pageHeight * pagesY;
var clearIndex = 8;

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

//Find the next safe place within the given length.
function scanSafe(line, i, length)
{
   var j, c;

   for(j = 0; j < length; ++j) 
   {
      if(i + j >= line.length)
         return line.length - 1;

      c = line.charCodeAt(i + j);

      if(c < charStart || c >= charStart + 64) 
         return i + j; 
   }

   return true;
}

function parseMessage(line, i)
{
   var l = charsToInt(line, i, 2); //12 bits (2 chars) for message length
   var result = { full : line.substring(i + 2, i + 2 + l), totalLength: l + 2 };
   var colon = result.full.indexOf(":");
   if(colon >= 0)
   {
      result.username = result.full.substr(0, colon + 1);
      result.message = result.full.substr(colon + 1);
   }
   return result;
}

//Parse the next line. Is it REALLY going to be ok creating all these objects?
function parseSingleLine(line, i)
{
   return new LineData(
      charsToInt(line, i + 8, 1),            //Width
      charsToInt(line, i + 9, 1),            //Color (index)
      chPx(line, i), chPx(line, i + 2),      //Point 1
      chPx(line, i + 4), chPx(line, i + 6),  //Point 2
   );
}

//Parse lines from i for the given length. Length must be valid!
function parseLines(line, i, length)
{
   if(((length - 6) % 4) !== 0) return null;

   var result = [];
   var width = charsToInt(line, i, 1);
   var color = charsToInt(line, i + 1, 1);
   var lastX = chPx(line, i + 2);
   var lastY = chPx(line, i + 4);
   var x = null, y;

   for(var j = 6; j < length; j+=4)
   {
      x = chPx(line, i + j);
      y = chPx(line, i + j + 2);
      result.push(new LineData(width, color, lastX, lastY, x, y));
      lastX = x; lastY = y;
   }

   if(x === null) //A strange optimization: single pixel = 1 point
      result.push(new LineData(width, color, lastX, lastY, lastX, lastY));

   return result;
}

//Attempt to parse the next usable chunk of data. The "jump" field describes
//where you can skip to after parsing, and "result" is the data we parsed.
//"type" says WHAT we parsed. result can be null if nothing of value was read.
function tryParseNext(line, i)
{
   var result = null;
   var type = "lines";

   if(i >= line.length)
   {
      type = "end";
   }
   else if(line.charAt(i) === "(")
   {
      type = "message";
      result = parseMessage(line, ++i); //Skip the "(" and parse a message
      i += result.totalLength;          //Skip the whole message
   }
   else if(line.charAt(i) === ".")
   {
      var end = line.indexOf(".", ++i); //Skip the "." and find the next "."
      if(end < 0) return tryParseNext(line, line.length); //there's nothing valid to the end
      var length = end - i;
      var n = scanSafe(line, i, length);
      if(n !== true) return tryParseNext(line, n + 1);
      result = parseLines(line, i, length);
      i = end + 1;
   }
   else
   {
      var n = scanSafe(line, i, lineBytes);
      if(n !== true) return tryParseNext(line, n + 1);
      result = [ parseSingleLine(line, i) ];
      i += lineBytes;
   }

   return {
      type: type,
      result: result,
      jump: i 
   };
}

//A simple method for processing raw data and funelling parsed 
//lines/messages to the given functions.
function processRaw(data, lineFunc, messageFunc)
{
   var result;
   var i = 0, j;

   while(i < data.length)
   {
      result = tryParseNext(data, i);

      if(result.type === "end" || !result)
      {
         break;
      }
      else if(result.type === "message")
      {
         messageFunc(result.result);
      }
      else if(result.type === "lines")
      {
         for(j = 0; j < result.result.length; j++)
            lineFunc(result.result[j]);
      }

      i = result.jump;
   }
}

//Given a set of LineData, produce optimized string data.
function createOptimizedLines(lines)
{
   var result = "";
   var cc = 0; //Current chunk
   var j;

   for(var i = 0; i < lines.length; i++)
   {
      //If we're at the end, we need to break our chunk anyway. Otherwise, look
      //ahead to see if the next line is a continuation of ours. If it's NOT,
      //break the line. Otherwise continue moving forward
      if(i === lines.length - 1 ||
         lines[i + 1].paletteIndex !== lines[i].paletteIndex ||
         lines[i + 1].width !== lines[i].width ||
         lines[i + 1].x1 !== lines[i].x2 ||
         lines[i + 1].y1 !== lines[i].y2)
      {
         //If it's a single line, produce the old version
         if(i - cc === 0)
         {
            result += pxCh(lines[i].x1) + pxCh(lines[i].y1) + 
               pxCh(lines[i].x2) + pxCh(lines[i].y2) +
               intToChars(lines[i].width, 1) + 
               intToChars(lines[i].paletteIndex, 1);
         }
         else
         {
            result += "." + intToChars(lines[i].width, 1) + 
               intToChars(lines[i].paletteIndex, 1) +
               pxCh(lines[cc].x1) + pxCh(lines[cc].y1);
            for(j = cc; j <= i; j++)
               result += pxCh(lines[j].x2) + pxCh(lines[j].y2);
            result += ".";
         }
         cc = i + 1;
      }
   }

   return result;
}

//The draw system is paged, always (basically). And even if it isn't, you don't
//HAVE to use this function!
function updatePage(existing, amount)
{
   var newPage = ((existing || 0) + amount + pagesTotal) % pagesTotal;

   var leftRaw = (-600 * (newPage % pagesX));
   var topRaw = (-600 * Math.floor(newPage / pagesX));
   return {
      "left": leftRaw + "px",
      "top": topRaw + "px",
      "leftRaw": leftRaw,
      "topRaw": topRaw,
      "page": newPage,
      "pageText": "Page " + (newPage + 1).toString().padStart(Math.ceil(Math.log10(pagesTotal)), '0')
   };
}

//An object to store a single line
function LineData(width, paletteIndex, x1, y1, x2, y2)
{
   this.width = width;
   this.color = palette[paletteIndex % palette.length];
   this.paletteIndex = paletteIndex;
   this.x1 = x1;
   this.y1 = y1;
   this.x2 = x2;
   this.y2 = y2;
}

function drawSimpleLine(ctx, ld)
{
   var xdiff = ld.x2 - ld.x1;
   var ydiff = ld.y2 - ld.y1;
   var dist = Math.sqrt(xdiff*xdiff+ydiff*ydiff);
   var ang = Math.atan(ydiff/(xdiff===0?0.0001:xdiff))+(xdiff<0?Math.PI:0); 
   var ofs = (ld.width - 1) / 2;

   if(dist === 0) dist=0.001;

   ctx.fillStyle = ld.color;

   for(var i=0;i<dist;i+=0.5) 
   {
      ctx.fillRect(Math.round(ld.x1+Math.cos(ang)*i-ofs), 
                   Math.round(ld.y1+Math.sin(ang)*i-ofs), 
                   ld.width, ld.width);
   }
}

//The draw system needs an easy way to create message nodes.
function createMessageElement(parsed)
{
   var msg = parsed.full;
   var msgelem = document.createElement("div");
   msgelem.className = "message";

   if(parsed.username)
   {
      var username = document.createElement("span");
      username.className = "username";
      username.appendChild(document.createTextNode(parsed.username));
      msgelem.appendChild(username);
      msg = parsed.message;
   }

   msgelem.append(document.createTextNode(msg));
   return msgelem;
}

// Base64 encode/decode  http://www.webtoolkit.info 
var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    , encode: function (input) {
        var output = ""; var i = 0;
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        input = Base64._utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++); chr2 = input.charCodeAt(i++); chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) { enc3 = enc4 = 64; }
            else if (isNaN(chr3)) { enc4 = 64; }
            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    }
    ,decode: function (input) {
        var output = ""; var i = 0;
        var chr1, chr2, chr3; var enc1, enc2, enc3, enc4;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) { output = output + String.fromCharCode(chr2); }
            if (enc4 != 64) { output = output + String.fromCharCode(chr3); }
        }
        output = Base64._utf8_decode(output);
        return output;
    }
    ,_utf8_encode: function (string) {
        var utftext = ""; string = string.replace(/\r\n/g, "\n");
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) { utftext += String.fromCharCode(c); }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
    ,_utf8_decode: function (utftext) {
        var string = ""; var i = 0;
        var c, c1, c2, c3; c = c1 = c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) { string += String.fromCharCode(c); i++; }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
 };

