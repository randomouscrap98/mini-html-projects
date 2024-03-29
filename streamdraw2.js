//Requires:
// -StreamConvert (mini.js?)
// -MiniDraw      (mini.js?)

function StreamDrawPageData(name)
{
   this.date = (new Date()).toISOString(); //Always a string
   this.name = name || this.date.substr(0, 10);
}

//This is the simplified version of streamdraw1, without the massive ignore
//color system


//The core parser for simple elements of the streamdraw system
function StreamDrawElementParser(width, height)
{
   this.SetSize(width, height);

   //These are technically constants! 
   this.COLORBYTES = 4;
   this.MESSAGELENGTHBYTES = 2;
   this.PAGELENGTHBYTES = 2;
   this.POINTBYTES = 4;
   this.SIZEBYTES = 1;

   this.PATTERNSYMBOL = "!";
   this.PATTERNBYTES = 3;
}

StreamDrawElementParser.prototype.SetSize = function(width, height)
{
   //Take width/height, find the closest power of 2 that will contain it, and
   //compute the shift and max value from that.
   this.xShift = Math.ceil(Math.log2(width));
   this.yShift = Math.ceil(Math.log2(height));

   var maxBits = this.POINTBYTES * 6;

   //Oops, it takes up too much space! We know the stream system gives us 6
   //bits per byte, and the shifts are bytes. This may require some refactoring
   if((this.xShift + this.yShift + 1) > maxBits)
      throw `Unusable width/height! Total bits to store exceeds ${maxBits}`;

   //These are useful for storing/parsing
   this.xMax = Math.pow(2, this.xShift) - 1;
   this.yMax = Math.pow(2, this.yShift) - 1;
};

StreamDrawElementParser.prototype.MessageSize = function(data, current)
{
   return this.MESSAGELENGTHBYTES + StreamConvert.CharsToInt(data, current, this.MESSAGELENGTHBYTES);
};

StreamDrawElementParser.prototype.PageSize = function(data, current)
{
   return this.PAGELENGTHBYTES + StreamConvert.CharsToInt(data, current, this.PAGELENGTHBYTES);
};

// -------------------
// -- PARTIAL PARSE --
// -------------------

//WARNING:!!! 'extra' indicates if this point is color or erasing! just keep
//the system!
StreamDrawElementParser.prototype.CreateStandardPoint = function(x, y, extra)
{
   return StreamConvert.IntToChars(
      (extra ? 1 : 0) + ((x & this.xMax) << 1) + ((y & this.yMax) << (1 + this.xShift)), 
      this.POINTBYTES);
};

StreamDrawElementParser.prototype.ParseStandardPoint = function(data, start)
{
   var header = StreamConvert.CharsToInt(data, start, this.POINTBYTES);
   return { 
      x : (header >> 1) & this.xMax, 
      y : (header >> (1 + this.xShift)) & this.yMax, 
      extra : header & 1,
      skip : this.POINTBYTES 
   };
};

StreamDrawElementParser.prototype.CreateColorData = function(color)
{
   return StreamConvert.IntToChars(parseInt((color || "#000000").replace("#", "0x")),this.COLORBYTES);
};

StreamDrawElementParser.prototype.ParseColorData = function(data, start)
{
   return {
      color : "#" + StreamConvert.CharsToInt(data, start, this.COLORBYTES)
         .toString(16).toUpperCase().padStart(6, "0"),
      skip : this.COLORBYTES
   };
};


// ---------------------
// -- ELEMENT PARSERS --
// ---------------------

// NOTE: all these element parsers parse AFTER the identifier. So, the raw data
// stream format has this idea of containers which house the data you see here.
// I can't just dump the data generated here (such as CreateMessage) directly
// into the stream, because the parser won't know it's a message.
//
// SO: when writing new generators/parsers here, keep that in mind. These go
// INSIDE containers and thus don't need to self-identify. Don't include the
// tokens and endcaps and whatever!

StreamDrawElementParser.prototype.CreateMessage = function(username, message)
{
   var m = username + ":" + message;
   var max = StreamConvert.MaxValue(this.MESSAGELENGTHBYTES);
   if(m.length > max)
      m = m.substr(0, max);
   return StreamConvert.IntToChars(m.length, this.MESSAGELENGTHBYTES) + m;
};

//This produces an object that represents the message
StreamDrawElementParser.prototype.ParseMessage = function(data, start, length)
{
   var fullMessage = data.substr(start + this.MESSAGELENGTHBYTES, 
      length - this.MESSAGELENGTHBYTES);

   var colon = fullMessage.indexOf(":");
   var result = { username : "???", message : fullMessage };

   if(colon >= 0)
   {
      result.username = fullMessage.substr(0, colon);
      result.message = fullMessage.substr(colon + 1);
   }

   return result;
};

StreamDrawElementParser.prototype.CreatePage = function(page)
{
   var pageData = JSON.stringify(page);
   var max = StreamConvert.MaxValue(this.PAGELENGTHBYTES);
   if(pageData.length > max)
      throw `Unrecoverable error: can't create page (too large! ${pageData.length} vs ${max})`;
   return StreamConvert.IntToChars(pageData.length, this.PAGELENGTHBYTES) + pageData;
};

StreamDrawElementParser.prototype.ParsePage = function(data, start, length)
{
   var fullMessage = data.substr(start + this.PAGELENGTHBYTES, length - this.PAGELENGTHBYTES);
   return JSON.parse(fullMessage);
};

//A stroke is an optimized continuous line. As such, it doesn't need to store
//each line segment, it's more of a "path".
StreamDrawElementParser.prototype.CreateStroke = function(lines, recurseJoiner)
{
   var result = "";

   //NOTE: Assume all line colors/size/etc are the same.
   //NOTE: we put the first point at the front, it shows where it all starts
   //AND indicates our intent to color or not color. It must come first,
   //because of the "no color data set on clear" optimization (we must know
   //whether to skip that data or not)
   result += this.CreateStandardPoint(lines[0].x1, lines[0].y1, lines[0].color);
   result += StreamConvert.IntToChars(lines[0].width, this.SIZEBYTES);

   if(lines[0].patternId) //pattern needs to be a 16 bit number
      result += this.PATTERNSYMBOL + StreamConvert.IntToChars(lines[0].patternId, this.PATTERNBYTES);

   //Color is ONLY added if we're not erasing. It's a sort of space optimization,
   //saves 4 whole bytes on erasing
   if(lines[0].color)
      result += this.CreateColorData(lines[0].color);

   var lastx = lines[0].x1;
   var lasty = lines[0].y1;
   var ofsx, ofsy;

   //Now do all relative points until we run out
   for(var i = 0; i < lines.length; i++)
   {
      if(lines[i].x1 != lastx || lines[i].y1 != lasty)
      {
         //Oof, we have to stop and recurse!
         if(typeof recurseJoiner === "string")
         {
            console.warn("Stroke break, recursing at ", i);
            lines.splice(0, i);
            return result + recurseJoiner + this.CreateStroke(lines, recurseJoiner);
         }
         else
         {
            console.warn("Stroke break, NOT SENDING at ", i);
         }
      }

      ofsx = lines[i].x2 - lastx;
      ofsy = lines[i].y2 - lasty;

      result += 
         StreamConvert.IntToVariableWidth(StreamConvert.SignedToSpecial(ofsx)) +
         StreamConvert.IntToVariableWidth(StreamConvert.SignedToSpecial(ofsy));

      lastx = lines[i].x2;
      lasty = lines[i].y2;
   }

   return result;
};

// This converts a stroke chunk into MiniDraw line data
StreamDrawElementParser.prototype.ParseStroke = function(data, start, length)
{
   var t, t2; //These are temp variables, used throughout
   var point = this.ParseStandardPoint(data, start);
   var size = StreamConvert.CharsToInt(data, start + point.skip, this.SIZEBYTES);
   var l = point.skip + this.SIZEBYTES;
   var color = false;
   var pattern = false;

   if(data[start + l] === this.PATTERNSYMBOL)
   {
      pattern = StreamConvert.CharsToInt(data, start + l + 1, this.PATTERNBYTES);
      l += (1 + this.PATTERNBYTES)
   }

   if(point.extra)
   {
      t = this.ParseColorData(data, start + l);
      color = t.color;
      l += t.skip;
   }

   //even if it's too big, assume each segment is 1 byte
   var segment = new Array(2 + length - l);
   segment[0] = point.x;
   segment[1] = point.y;
   var si = 2;

   //CAREFUL: t is still an object at this point, which is why we can use it in
   //the Fast function. If you change/use t before here, PLEASE fix that!
   while(l < length)
   {
      //This is an excessive optimization: the stroke uses DISTANCES between
      //points instead of actual points, which allows for 50% less data usage
      //for any two points within 5 bits (31) of each other, which is most.
      t = StreamConvert.VariableWidthToInt(data, start + l);
      l += t.length;
      //Minus 2 for the last matching x/y coordinate (remember it's a distance)
      t2 = segment[si - 2] + StreamConvert.SpecialToSigned(t.value);
      segment[si++] = t2;
   }

   if(si & 1)
   {
      //As often as possible. try to recover from errors.
      console.error(`Dangling point on parsed stroke: ${si}`);
      si--;
   }

   //Duplicate the last point in case it doesn't line up nicely
   if(si < 4) //This isn't BYTES, it's point data, 4 as in 2 xy points
   {
      segment[2] = segment[0];
      segment[3] = segment[2];
      si = 4;
   }

   var result = new Array(si / 2 - 1); //Stroke has 1 fewer lines than points

   //Now generate the lines
   for(i = 0; i < si - 2; i += 2)
   {
      //false is the extra data indicating it's not just a normal line
      result[(i >> 1)] = new MiniDraw2.LineData(size, color, 
         segment[i], segment[i + 1], segment[i + 2], segment[i + 3], false, pattern);
   }

   return result;
};

//TODO: consider removing these basic redirects
StreamDrawElementParser.prototype.CreateBatchLines = function(lines) {
   return this.CreateGenericBatch(lines); };

StreamDrawElementParser.prototype.ParseBatchLines = function(data, start, length) {
   return this.ParseGenericBatch(data, start, length, false); };

StreamDrawElementParser.prototype.CreateBatchRects = function(lines) {
   return this.CreateGenericBatch(lines); };

StreamDrawElementParser.prototype.ParseBatchRects = function(data, start, length) {
   return this.ParseGenericBatch(data, start, length, true); };

//Lines and rectangles have nearly the same data format!
StreamDrawElementParser.prototype.CreateGenericBatch = function(lines)
{
   var result = "";

   result += this.CreateColorData(lines[0].color);
   result += (lines[0].is_solidrect() ? "" : StreamConvert.IntToChars(lines[0].width, this.SIZEBYTES));

   if(lines[0].patternId) //pattern needs to be a number
      result += this.PATTERNSYMBOL + StreamConvert.IntToChars(lines[0].patternId, this.PATTERNBYTES);

   //And now, just all the line data as-is (literally);
   lines.forEach(x => result += 
      this.CreateStandardPoint(x.x1, x.y1, x.color) +
      this.CreateStandardPoint(x.x2, x.y2, x.color));

   return result;
};

//Lines and rectangles have nearly the same data format!
StreamDrawElementParser.prototype.ParseGenericBatch = function(data, start, length, isRect)
{
   var result = [];
   var t2;
   var t = this.ParseColorData(data, start);
   var color = t.color;
   var l = t.skip;
   var size = 1;
   var pattern = false;
   
   if(!isRect)
   {
      size = StreamConvert.CharsToInt(data, start + l, this.SIZEBYTES);
      l += this.SIZEBYTES;
   }

   if(data[start + l] === this.PATTERNSYMBOL)
   {
      pattern = StreamConvert.CharsToInt(data, start + l + 1, this.PATTERNBYTES);
      l += (1 + this.PATTERNBYTES)
   }

   var extra = isRect ? MiniDraw2.BasicLineType(MiniDraw2.SOLIDRECT) : false;

   //This one is actually simpler, it's just blobs of lines (or rectangles)
   for(i = start + l; i < start + length; i += (2 * this.POINTBYTES))
   {
      t = this.ParseStandardPoint(data, i);
      t2 = this.ParseStandardPoint(data, i + this.POINTBYTES);
      result.push(new MiniDraw2.LineData(size, t.extra ? color : null, 
         t.x, t.y, t2.x, t2.y, extra, pattern));
   }

   return result;
};

//Because we had this old assumption that the only things we'd be drawing were
//non-antialiased lines and rectangles, anything outside of that assumption
//that may have non-standard data has to be specially crafted. 

//Image insert takes a single line which is ALREADY fully ready to insert an
//image (all data present) and creates raw stream data for it. Note that this
//is still considered standard line data, so the data must not have ' in it. As
//such, the link is converted to base64 (even though it's wasteful)
StreamDrawElementParser.prototype.CreateImageInsert = function(lines) {
   var line = lines[0]; //This may fail if they gave us no lines, but whatever
   var result = "0000"; //We have 4 reserved bytes. They're all 0 for now
   //Because of the nature of images, they won't be frequent, so we can waste
   //data using these much larger representations. Images can be posted
   //anywhere, I want them to be able to clip the edges at any time.
   result += StreamConvert.SignedToVariableWidth(line.x1);
   result += StreamConvert.SignedToVariableWidth(line.y1);
   result += StreamConvert.SignedToVariableWidth(line.x2);
   result += StreamConvert.SignedToVariableWidth(line.y2);
   //Then the rest is just the url. Note that, just in case we were given an
   //unloaded image data, we check for url first before going to the image.
   result += btoa(line.extra.url || line.extra.image.src);
   return result;
};

StreamDrawElementParser.prototype.ParseImageInsert = function(data, start, length) {
   //Image insert is only ever a single line. But the caller expects an array,
   //so be careful. Also, remember we have 4 reserved bytes we're not using
   //yet. I have plans for maybe 10 of them so far (hflip, vflip, rotate-360)
   var l = 4;
   var points = []; //x1,y1,x2,y2
   for(var i = 0; i < 4; i++)
   {
      var result = StreamConvert.VariableWidthToSigned(data, start + l);
      l += result.length;
      points.push(result.value);
   }
   //var x1 = StreamConvert.VariableWidthToSigned(data, start + l);
   //var x2 = StreamConvert.VariableWidthToSigned(data, start);
   //var t = this.ParseStandardPoint(data, start);
   //var t2 = this.ParseStandardPoint(data, start + this.POINTBYTES);
   //if(t.extra) t.x = -t.x;
   //if(t2.extra) t.y = -t.y;
   //var pointlen = this.POINTBYTES * 2;
   //var url = atob(data.substr(start + pointlen, length - pointlen));
   var url = atob(data.substr(start + l, length - l));

   return [
      //Some of the variables in linedata aren't used, such as size, color,
      //pattern. Note that since we can't wait for the image to load, we create
      //a special object which has just the URL. The line drawing function will
      //handle that for us.
      new MiniDraw2.LineData(0, null, points[0], points[1], points[2], points[3], {
      //t.x, t.y, t2.x, t2.y, {
         type: MiniDraw2.INSERTIMAGE,
         url: url
      }, 0)
   ];
};


// The mega parser that does overall data stream parsing. Requires an element
// parser to function. Assumes a page system
function StreamDrawSystemParser(elementParser)
{
   this.eparser = elementParser;

   //The default symbols; can be overridden as necessary
   this.symbols =          
   {
      text : "~",
      page : "#",
      cap : "'",
      //raw : "!",     //A SUPER ineficient way to store line data!
      //The rest are line segment idenfifiers, which are capped with, well, the
      //cap. This means the data contained within these containers must NOT
      //contain the cap character!! Be careful!
      stroke : "|",
      lines : "-",
      rectangles : "+",
      image : "i"
   };
}

//Scan data starting at start until func returns true or data ends. NOTE:
//datascan doesn't care about parsing or special circumstances or anything. All
//it understands is a VERY generic idea of "chunks". Imagine TCP/IP stack and
//the various levels of switches/etc.
StreamDrawSystemParser.prototype.DataScan = function(data, start, textfunc, linefunc, pagefunc)
{
   var current = start;
   var clength = 0;
   var scanned = 0;
   var cc;
   var func = false;
   var lengthModifier = 0;

   //Now start looping
   while(true)
   {
      if(current >= data.length)
         return;

      cc = data.charAt(current);

      //Text segments proclaim their length at the start
      if(cc == this.symbols.text)
      {
         clength = 1 + this.eparser.MessageSize(data, current + 1);
         lengthModifier = 1;
         func = textfunc;
      }
      //Page segments proclaim their length at the start
      else if(cc == this.symbols.page)
      {
         clength = 1 + this.eparser.PageSize(data, current + 1);
         lengthModifier = 1;
         func = pagefunc;
      }
      //Line segments end with a cap character, since there may be thousands of
      //them and a cap character is shorter than proclaiming the length by 1-2 bytes
      else if(
         cc == this.symbols.stroke || 
         cc == this.symbols.lines || 
         cc == this.symbols.rectangles ||
         cc == this.symbols.image
      ) {
         clength = data.indexOf(this.symbols.cap, current) - current + 1;
         lengthModifier = 2;
         func = linefunc;
      }
      else
      {
         throw `Unrecoverable data error! Unknown character in stream! cc: ${cc} pos: ${current}, start: ${start}`;
      }

      //2022 WARN: This used to be AFTER the func! I don't know why!
      scanned++;

      //Just make life easier: assume the start symbol is always 1 char, report 
      //the start + length as the core data without the symbol. if, in the
      //future, you need data tracking, put it in THIS DataScan function.
      if(func && func(current + 1, clength - lengthModifier, cc, current + clength, scanned))
         return;

      current += clength;
   }
};

StreamDrawSystemParser.prototype.CreateMessage = function(username, message)
{
   return this.symbols.text + this.eparser.CreateMessage(username, message);
};

StreamDrawSystemParser.prototype.CreatePage = function(page)
{
   return this.symbols.page + this.eparser.CreatePage(page);
};

StreamDrawSystemParser.prototype.CreateLines = function(type, layer, lines)
{
   var startChunk = StreamConvert.IntToVariableWidth(layer);
   var result = false;

   if(type == "stroke") 
   {
      startChunk = this.symbols.stroke + startChunk;
      result = this.eparser.CreateStroke(lines, this.symbols.cap + startChunk);
   }
   else if(type == "lines")
   {
      startChunk = this.symbols.lines + startChunk;
      result = this.eparser.CreateBatchLines(lines);
   }
   else if(type == "rectangles")
   {
      startChunk = this.symbols.rectangles + startChunk;
      result = this.eparser.CreateBatchRects(lines);
   }
   else if(type == "image")
   {
      startChunk = this.symbols.image + startChunk;
      result = this.eparser.CreateImageInsert(lines);
   }
   else
   {
      throw "Unknown pending lines type!";
   }

   return startChunk + result + this.symbols.cap;
};

//Parse a single blob of lines within a single stroke or idea or whatever. Just ONE
StreamDrawSystemParser.prototype.ParseLineChunk = function(data, start, length, type)
{
   if(type == this.symbols.stroke)
      return this.eparser.ParseStroke(data, start, length);
   else if(type == this.symbols.lines)
      return this.eparser.ParseBatchLines(data, start, length);
   else if(type == this.symbols.rectangles)
      return this.eparser.ParseBatchRects(data, start, length);
   else if(type == this.symbols.image)
      return this.eparser.ParseImageInsert(data, start, length);
   else
      throw `Unparseable data type ${type}`;
};



//The overall "manager" for the stream draw system. It scans the data and
//raises events for things it finds while scanning. Then, if the scanning is
//complete, you can request the lines for a particular page.
function StreamDrawSystem(parser, existingData)
{
   this.parser = parser;
   this.SetData(existingData);
}

StreamDrawSystem.prototype.ResetScanner = function()
{
   this.scanPointer = 0;
   this.pages = [];
};

StreamDrawSystem.prototype.ScanAtEnd = function()
{
   return this.scanPointer >= this.rawData.length;
};

StreamDrawSystem.prototype.SetData = function(data)
{
   this.ResetScanner();

   this.rawData = data || "";

   if(this.rawData)   //From MiniDraw
      this.preamble = parsePreamble(data);
   else
      this.preamble = false;
};

StreamDrawSystem.prototype.FindPage = function(name)
{
   for(var i = 0; i < this.pages.length; i++)
      if(this.pages[i].name === name)
         return this.pages[i];

   return false;
};

StreamDrawSystem.prototype.NewPageName = function()
{
   var dt = new Date();
   var baseName = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, '0') + 
      "-" + String(dt.getDate()).padStart(2, '0');
   var counter = 0;

   for(var i = 0; i < this.pages.length; i++)
      if(this.pages[i].name.startsWith(baseName))
         counter++;

   if(counter > 0)
      return `${baseName}(${counter + 1})`;
   else
      return baseName;
};

StreamDrawSystem.prototype.GetLastPage = function()
{
   if(this.pages.length)
      return this.pages[this.pages.length - 1];
   else
      return false;
};

StreamDrawSystem.prototype.GetLastPageName = function()
{
   var lastPage = this.GetLastPage();
   if(lastPage)
      return lastPage.name;
   return false;
};

StreamDrawSystem.prototype.IsLastPage = function(name)
{
   return this.pages.length > 0 && this.pages[this.pages.length - 1].name === name;
};


StreamDrawSystem.prototype.Scan = function(messageEvent, pageEvent, parseLimit, scanLimit)
{
   var me = this;
   var tracker = { realParsed : 0, scanCount : 0 };
   var scanGeneric = function(end, scanCount)
   {
      me.scanPointer = end;
      tracker.scanCount = scanCount;
      return (tracker.scanCount >= scanLimit || tracker.realParsed > parseLimit);
   };

   me.parser.DataScan(me.rawData, Math.max(me.scanPointer, me.preamble.skip), 
      (start, length, cc, end, scanCount) => //Messages
      {
         if(messageEvent)
            messageEvent(me.parser.eparser.ParseMessage(me.rawData, start, length));

         tracker.realParsed++;
         return scanGeneric(end, scanCount);
      },
      (start, length, cc, end, scanCount) => //Lines; we still need to track our pointer
      {
         return scanGeneric(end, scanCount);
      },
      (start, length, cc, end, scanCount) => //page func
      {
         var pageData = me.parser.eparser.ParsePage(me.rawData, start, length);
         pageData.start = end; //end is the start of the next section, which is the first non-page data in our page
         pageData.number = me.pages.length + 1;
         me.pages.push(pageData); //just assume all new page data is a new page.

         if(pageEvent)
            pageEvent(pageData);

         tracker.realParsed++;
         return scanGeneric(end, scanCount);
      }
   );

   tracker.atEnd = me.ScanAtEnd();
   return tracker; 
};


StreamDrawSystem.prototype.InitializeLineScan = function(pageName)
{
   var me = this;

   var pageData = me.FindPage(pageName);

   if(!pageData)
      throw "No page found with name " + pageName;

   //Doesn't matter if we're at the end or not, as long as we can find the page
   return {
      page : pageData,
      pointer : pageData.start
   }
};

//A critical function: scan through data in chunks to parse out lines. 
StreamDrawSystem.prototype.ScanLines = function(scanTracker, lineEvent, parseLimit, scanLimit)
{
   var me = this;
   var tracker = { realParsed : 0, scanCount : 0 };
   var scanGeneric = function(end, scanCount)
   {
      scanTracker.pointer = end;
      tracker.scanCount = scanCount;
      return (tracker.scanCount >= scanLimit || tracker.realParsed > parseLimit);
   };

   me.parser.DataScan(me.rawData, Math.max(scanTracker.pointer, me.preamble.skip), 
      (start, length, cc, end, scanCount) =>
      {
         return scanGeneric(end, scanCount);
      },
      (start, length, cc, end, scanCount) =>
      {
         var layerDat = StreamConvert.VariableWidthToInt(me.rawData, start);

         var newLines = me.parser.ParseLineChunk(me.rawData, 
            start + layerDat.length, length - layerDat.length, cc);

         //This may tank performance. Want max/min for the LAST chunk
         //tracker.lastMinY = 999999999;
         //tracker.lastMaxY = 0;
         for(let x of newLines)
         {
            x.layer = layerDat.value;
         }

         if(lineEvent)
            lineEvent(newLines);

         tracker.realParsed++;
         return scanGeneric(end, scanCount); 
      },
      (start, length, cc, end, scanCount) => //page func
      {
         //ALWAYS immediately quit on new page. This should leave our pointer
         //right on the page line, meaning no more lines are ever processed (we hope)
         return true; 
      }
   );

   return tracker; 
};

