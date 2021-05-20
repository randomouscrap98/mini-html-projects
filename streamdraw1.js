//Requires:
// -StreamConvert (mini.js?)
// -MiniDraw      (mini.js?)

//The core parser for simple elements of the streamdraw system
function StreamDrawElementParser(width, height)
{
   this.SetSize(width, height);

   //These symbols are for inner parsing
   this.ignoreSymbol = " ";

   //These are technically constants! 
   this.COLORBYTES = 4;
   this.MESSAGELENGTHBYTES = 2;
   this.POINTBYTES = 4;
   this.SIZEBYTES = 1;
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

// -------------------
// -- PARTIAL PARSE --
// -------------------

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

//Creating ignore data is a choice, so there are no checks performed to see if
//you "can" create ignore data. You gave us ignore data, we make it.
StreamDrawElementParser.prototype.CreateIgnoreData = function(ignoredColors)
{
   //Put colors into the space between the ignores, we'll know it's done
   //when we encounter another ignore character
   var result = this.ignoreSymbol;
   ignoredColors.forEach(x => result += this.CreateColorData(x));
   return result + this.ignoreSymbol;
};

//Ignore data in a DATASTREAM is optional, and thus we must test for the
//existence of it (checking for symbols isn't normally what we do in these)
StreamDrawElementParser.prototype.ParseIgnoreData = function(data, start, length)
{
   if(data.charAt(start) === this.ignoreSymbol)
   {
      //There IS data out there that, unfortunately, has this non-ending
      //glitch. If so, just ignore the space.
      var iglength = data.indexOf(this.ignoreSymbol, start + 1);
      var complexRect = null;

      //If a space is not found, or a space is found outside of the designated
      //line data, this is an error. Just assume the space is erroneous (from
      //an old system) and move on
      if(iglength < 0 || iglength >= start + length) 
      {
         console.warn("Found erroneous ignore symbol (probably from old 'under' system'), ignoring");
         iglength = 1;
      }
      else
      {
         //This is the length of the WHOLE ignore section, which includes the
         //front and end symbols
         iglength = iglength - start + 1;
         //Now pull the ignored colors out of the line data, starting right
         //after the initial identifying symbol and ending before the last
         //symbol. So for instance, if iglength is 6 (meaning 1 color), the 
         //loop will run for 1, then stop at 5
         var ignoredColors = [];
         for(var i = 1; i < iglength - 1; i += 4) //where does 4 come from? is this a constant?
            ignoredColors.push(this.ParseColorData(data, start + i).color);
         //Generate the complex rectangle function to be used to draw this thing.
         //We track the FOR REAL individual line data for drawing in this
         //parsing function so we can draw the lines immediately without posting.
         complexRect = MiniDraw.GetComplexRectFromIgnore(ignoredColors);
      }

      return { skip : iglength, complexRect : complexRect };  
   }

   return null;
};

// ---------------------
// -- ELEMENT PARSERS --
// ---------------------

StreamDrawElementParser.prototype.CreateMessage = function(username, message)
{
   //TODO:
   //This DAMN SPACE is here to stay, half the first giant journal already uses
   //it. Perhpaps swap it out when you get to the second journal.
   var m = username + ": " + message;
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

StreamDrawElementParser.prototype.CreateStroke = function(lines, ignoredColors, recurseJoiner)
{
   var result = "";

   if(ignoredColors && ignoredColors.length)
      result += this.CreateIgnoreData(ignoredColors);

   //NOTE: Assume all line colors/size/etc are the same.
   result += this.CreateStandardPoint(lines[0].x1, lines[0].y1, lines[0].color);
   result += StreamConvert.IntToChars(lines[0].width, this.SIZEBYTES);

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
            return result + recurseJoiner + 
               this.CreateStroke(lines, ignoredColors, recurseJoiner);
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
   var ignoreData = this.ParseIgnoreData(data, start, length);

   if(ignoreData)
   {
      start += ignoreData.skip;
      length -= ignoreData.skip;
   }

   var t, t2; //These are temp variables, used throughout
   var point = this.ParseStandardPoint(data, start);
   var size = StreamConvert.CharsToInt(data, start + point.skip, this.SIZEBYTES);
   var l = point.skip + this.SIZEBYTES;
   var color = false;

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
      result[(i >> 1)] = new MiniDraw.LineData(size, color, 
         segment[i], segment[i + 1], segment[i + 2], segment[i + 3], 
         false, ignoreData ? ignoreData.complexRect : null);
   }

   return result;
};

StreamDrawElementParser.prototype.CreateBatchLines = function(lines, ignoredColors) {
   return this.CreateGenericBatch(lines, ignoredColors); };

StreamDrawElementParser.prototype.ParseBatchLines = function(data, start, length) {
   return this.ParseGenericBatch(data, start, length, false); };

StreamDrawElementParser.prototype.CreateBatchRects = function(lines, ignoredColors) {
   return this.CreateGenericBatch(lines, ignoredColors); };

StreamDrawElementParser.prototype.ParseBatchRects = function(data, start, length) {
   return this.ParseGenericBatch(data, start, length, true); };

//Lines and rectangles have nearly the same data format!
StreamDrawElementParser.prototype.CreateGenericBatch = function(lines, ignoredColors)
{
   var result = "";

   if(ignoredColors && ignoredColors.length)
      result += this.CreateIgnoreData(ignoredColors);

   result += this.CreateColorData(lines[0].color);
   result += (lines[0].rect ? "" : StreamConvert.IntToChars(lines[0].width, this.SIZEBYTES));

   //And now, just all the line data as-is (literally);
   lines.forEach(x => result += 
      this.CreateStandardPoint(x.x1, x.y1, x.color) +
      this.CreateStandardPoint(x.x2, x.y2, x.color));

   return result;
};

//Lines and rectangles have nearly the same data format!
StreamDrawElementParser.prototype.ParseGenericBatch = function(data, start, length, isRect)
{
   var ignoreData = this.ParseIgnoreData(data, start, length);
   if(ignoreData)
   {
      start += ignoreData.skip;
      length -= ignoreData.skip;
   }

   var result = [];
   var t2;
   var t = this.ParseColorData(data, start);
   var color = t.color;
   var l = t.skip;
   var size = 1;
   
   if(!isRect)
   {
      size = StreamConvert.CharsToInt(data, start + l, this.SIZEBYTES);
      l += this.SIZEBYTES;
   }

   //This one is actually simpler, it's just blobs of lines (or rectangles)
   for(i = start + l; i < start + length; i += (2 * this.POINTBYTES))
   {
      t = this.ParseStandardPoint(data, i);
      t2 = this.ParseStandardPoint(data, i + this.POINTBYTES);
      result.push(new MiniDraw.LineData(size, t.extra ? color : null, 
         t.x, t.y, t2.x, t2.y, isRect, ignoreData ? ignoreData.complexRect : null));
   }

   return result;
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
      stroke : "|",
      lines : "-",
      rectangles : "+",
      cap : "'"
   };
}

//Scan data starting at start until func returns true or data ends. NOTE:
//datascan doesn't care about parsing or special circumstances or anything. All
//it understands is a VERY generic idea of "chunks". Imagine TCP/IP stack and
//the various levels of switches/etc.
StreamDrawSystemParser.prototype.DataScan = function(data, start, textfunc, linefunc)
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

      if(cc == this.symbols.text)
      {
         clength = 1 + this.eparser.MessageSize(data, current + 1);
         lengthModifier = 1;
         func = textfunc;
      }
      else if(cc == this.symbols.stroke || cc == this.symbols.lines || cc == this.symbols.rectangles)
      {
         clength = data.indexOf(this.symbols.cap, current) - current + 1;
         lengthModifier = 2;
         func = linefunc;
      }
      else
      {
         throw `Unrecoverable data error! Unknown character in stream! cc: ${cc} pos: ${current}`;
      }

      //Just make life easier: assume the start symbol is always 1 char, report 
      //the start + length as the core data without the symbol. if, in the
      //future, you need data tracking, put it in THIS DataScan function.
      if(func && func(current + 1, clength - lengthModifier, cc, current + clength, scanned))
         return;

      current += clength;
      scanned++;
   }
};

StreamDrawSystemParser.prototype.CreateMessage = function(username, message)
{
   return this.symbols.text + this.eparser.CreateMessage(username, message);
};

StreamDrawSystemParser.prototype.CreateLines = function(type, page, lines, ignoredColors)
{
   var startChunk = StreamConvert.IntToVariableWidth(page);
   var result = false;

   if(type == "stroke") 
   {
      startChunk = this.symbols.stroke + startChunk;
      result = this.eparser.CreateStroke(lines, ignoredColors, this.symbols.cap + startChunk);
   }
   else if(type == "lines")
   {
      startChunk = this.symbols.lines + startChunk;
      result = this.eparser.CreateBatchLines(lines, ignoredColors);
   }
   else if(type == "rectangles")
   {
      startChunk = this.symbols.rectangles + startChunk;
      result = this.eparser.CreateBatchRects(lines, ignoredColors);
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
   else
      throw `Unparseable data type ${type}`;
};



//The "system" is a containerized version of Core which includes pagination
//(for version 1) and further parsing abilities
function StreamDrawSystem(parser, existingData)
{
   this.parser = parser;
   this.SetData(existingData);
}

StreamDrawSystem.prototype.ResetDrawTracking = function()
{
   this.drawPointer = 0;
   this.scheduledLines = [];
   this.maxPage = 0;
};

StreamDrawSystem.prototype.ResetMessageTracking = function()
{
   this.messagePointer = 0;
   this.scheduledMessages = [];
};

StreamDrawSystem.prototype.SetData = function(data)
{
   this.ResetDrawTracking();
   this.ResetMessageTracking();

   this.rawData = data || "";

   if(this.rawData)   //From MiniDraw
      this.preamble = parsePreamble(data);
   else
      this.preamble = false;
};


//A critical function: scan through data in chunks to parse out lines. 
StreamDrawSystem.prototype.ProcessLines = function(parseLimit, scanLimit, page)
{
   var me = this;
   var realParsed = 0;

   me.parser.DataScan(me.rawData, Math.max(me.drawPointer, me.preamble.skip), false,
      (start, length, cc, end, scanCount) =>
      {
         //Honor a scanLimit of 0 by doing this first
         if (scanCount > scanLimit || realParsed > parseLimit)
            return true;

         me.drawPointer = end;

         //We ALSO only handle the draw if it's the right PAGE.
         var pageDat = StreamConvert.VariableWidthToInt(me.rawData, start);
         me.maxPage = Math.max(me.maxPage, pageDat.value);

         if(pageDat.value != page)
            return false;

         me.scheduledLines.push(...me.parser.ParseLineChunk(
            me.rawData, start + pageDat.length, length - pageDat.length, cc));

         realParsed++;

         return false;
      }
   );
};

//The message handler
StreamDrawSystem.prototype.ProcessMessages = function(parseLimit, scanLimit)
{
   var me = this;
   var realParsed = 0;

   me.parser.DataScan(me.rawData, Math.max(me.messagePointer, me.preamble.skip), 
      (start, length, cc, end, scanCount) => 
      {
         //Honor a scanLimit of 0 by doing this first
         if (scanCount > scanLimit || realParsed > parseLimit)
            return true;

         me.messagePointer = end; //TODO: Fix this crazy parser.eparser thing
         me.scheduledMessages.push(me.parser.eparser.ParseMessage(me.rawData, start, length));

         realParsed++;

         return false;
      }
   );
};

