
//black, gray, light gray, white
//red, pink, purple, blue
//light blue, cyan, green, light green, 
//yellow, orange, brown, tan
var palette = [
   "#131313", "#5d5d5d", "#858585", "#ffffff", 
   "#c42430", "#fdd2ed", "#7a09fa", "#0069aa", 
   "#94fdff", "#0cf1ff", "#1e6f50", "#99e65f", 
   "#ffeb57", "#edab50", "#8a4836", "#f9e6cf", 

   "#ff0040", "#1b1b1b", "#272727", "#3d3d3d",
   "#b4b4b4", "#c7cfdd", "#92a1b9", "#657392",
   "#424c6e", "#2a2f4e", "#1a1932", "#0e071b",
   "#1c121c", "#391f21", "#5d2c28", "#bf6f4a",

   "#e69c69", "#f6ca9f", "#e07438", "#c64524",
   "#8e251d", "#ff5000", "#ed7614", "#ffa214",
   "#ffc825", "#d3fc7e", "#5ac54f", "#33984b",
   "#134c4c", "#0c2e44", "#00396d", "#0098dc",

   "#00cdf9", "#f389f5", "#db3ffd", "#3003d9",
   "#0c0293", "#03193f", "#3b1443", "#622461",
   "#93388f", "#ca52c9", "#c85086", "#f68187",
   "#f5555d", "#ea323c", "#891e2b", "#571c27"
   /*"rgb(0,0,0)", "rgb(87,87,87)", "rgb(160,160,160)", "rgb(255,255,255)",
   "rgb(173,35,35)", "rgb(255,205,243)", "rgb(129,38,192)", "rgb(42,75,215)",
   "rgb(157,175,255)", "rgb(41,208,208)", "rgb(29,105,20)", "rgb(129,197,122)", 
   "rgb(255,238,51)", "rgb(255,146,51)", "rgb(129,74,25)", "rgb(233,222,187)",

   "#be4a2f", "#d77643", "#ead4aa", "#e4a672",
   "#b86f50", "#733e39", "#3e2731", "#a22633",
   "#e43b44", "#f77622", "#feae34", "#fee761",
   "#63c74d", "#3e8948", "#265c42", "#193c3e",

   "#124e89", "#0099db", "#2ce8f5", "#c0cbdc",
   "#8b9bb4", "#5a6988", "#3a4466", "#262b44",
   "#181425", "#ff0044", "#68386c", "#b55088",
   "#f6757a", "#e8b796", "#c28569"*/
   /*"#bb4646", "#9d4b4b", "#ad725b", "#ad895b",
   "#c1a95c", "#e4c04c", "#e4934c", "#e94736",
   "#c78d87", "#fee89d", "#ba6528", "#684024",
   "#e6a87f", "#ffd13e", "#e16a26", "#916a53",

   "#4e99c8", "#538791", "#77aeb8", "#aed0d7",
   "#a8e8dc", "#caffe7", "#5d9065", "#0067ff",
   "#73c812", "#2f94fe", "#426a94", "#b4e8ff",
   "#1eb08a", "#aeea55", "#1e7da4", "#ecffca",

   "#ff0095", "#ff6595", "#d9386a", "#bd41b7",
   "#d194ce", "#752669", "#e29fc9", "#ffe2f1",
   "#e6d0f6", "#f0787e", "#787ff0", "#f44bff",
   "#8900ff", "#343434", "#f4ede9", "#efefef"*/
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

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info
*
**/
var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    // public method for encoding
    , encode: function (input)
    {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length)
        {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2))
            {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3))
            {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        } // Whend

        return output;
    } // End Function encode


    // public method for decoding
    ,decode: function (input)
    {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length)
        {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64)
            {
                output = output + String.fromCharCode(chr2);
            }

            if (enc4 != 64)
            {
                output = output + String.fromCharCode(chr3);
            }

        } // Whend

        output = Base64._utf8_decode(output);

        return output;
    } // End Function decode


    // private method for UTF-8 encoding
    ,_utf8_encode: function (string)
    {
        var utftext = "";
        string = string.replace(/\r\n/g, "\n");

        for (var n = 0; n < string.length; n++)
        {
            var c = string.charCodeAt(n);

            if (c < 128)
            {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048))
            {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else
            {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        } // Next n

        return utftext;
    } // End Function _utf8_encode

    // private method for UTF-8 decoding
    ,_utf8_decode: function (utftext)
    {
        var string = "";
        var i = 0;
        var c, c1, c2, c3;
        c = c1 = c2 = 0;

        while (i < utftext.length)
        {
            c = utftext.charCodeAt(i);

            if (c < 128)
            {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224))
            {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else
            {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        } // Whend

        return string;
    } // End Function _utf8_decode
 };

