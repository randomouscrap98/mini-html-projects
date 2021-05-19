//Requires:
// -StreamConvert (mini.js?)
// -MiniDraw      (mini.js?)

//NOTE: This is the CORE, it doesn't hold data or canvases or any of that! it
//only provides the functionality
function StreamDrawCore1(width, height)
{
   this.symbols =          //The default symbols; can be overridden as necessary
   {
      text : "~",
      stroke : "|",
      lines : "-",
      rectangles : "+",
      cap : "'",
      ignore : " "
   };

   this.SetSize(width, height);

   //These are technically constants! 
   this.COLORBYTES = 4;
   this.MESSAGELENGTHBYTES = 2;
   this.POINTBYTES = 4;
   this.SIZEBYTES = 1;
};

StreamDrawCore1.prototype.SetSize = function(width, height)
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

//Scan data starting at start until func returns true or data ends. NOTE:
//datascan doesn't care about parsing or special circumstances or anything. All
//it understands is a VERY generic idea of "chunks". Imagine TCP/IP stack and
//the various levels of switches/etc.
StreamDrawCore1.prototype.DataScan = function(data, start, func)
{
   //always skip preamble
   //if(start < this.preambleSkip)
   //   start = this.preambleSkip;

   //maxScan = maxScan || 999999999;
   var current = start;
   var clength = 0;
   var scanned = 0;
   var cc;

   //Now start looping
   while(true)
   {
      if(current >= data.length) // || scanned > maxScan)
         return;

      cc = data.charAt(current);

      if(cc == this.symbols.text)
      {
         clength = 1 + this.MESSAGELENGTHBYTES + 
            StreamConvert.CharsToInt(data, current + 1, this.MESSAGELENGTHBYTES);
      }
      else if(cc == this.symbols.stroke || cc == this.symbols.lines || cc == this.symbols.rectangles)
      {
         clength = data.indexOf(this.symbols.cap, current) - current + 1;
      }
      else
      {
         throw `Unrecoverable data error! Unknown character in stream! cc: ${cc} pos: ${current}`;
      }

      if(clength <= 0)
         clength = data.length - current;

      //Just make life easier: assume the start symbol is always 1 char, report 
      //the start + length as the core data without the symbol. if, in the
      //future, you need data tracking, put it in THIS DataScan function.
      if(func(current + 1, clength - 1, cc, current += clength, ++scanned))
         return;
   }
};

StreamDrawCore1.prototype.Flood = function(context, cx, cy, color, currentLines, maxLines)
{
   //Do the east/west thing, generate the lines, IGNORE future strokes
   //Using a buffer because working with image data can (does) cause it to go
   //into software rendering mode, which is very slow
   var width = context.canvas.width;
   var height = context.canvas.height;
   var iData = context.getImageData(0, 0, width, height);
   var img = iData.data;
   var queue = [[Math.round(cx), Math.round(cy)]];
   var rIndex = MiniDraw.GetIndex(iData, cx, cy);
   var replaceColor = [img[rIndex], img[rIndex+1], img[rIndex+2], img[rIndex+3]];
   console.log("Flood into color: ", replaceColor, cx, cy);
   maxLines = maxLines || 999999999;
   var west, east, i, j;
   var shouldFill = (x, y) =>
   {
      if(x < 0 || y < 0 || x >= width || y >= height)
         return false;
      var i = MiniDraw.GetIndex(iData, x, y);
      return img[i] == replaceColor[0] && img[i + 1] == replaceColor[1] &&
         img[i + 2] == replaceColor[2] && img[i + 3] == replaceColor[3];
   };
   while(queue.length)
   {
      var p = queue.pop();
      if(shouldFill(p[0],p[1]))
      {
         //March left until not should fill, march right
         for(west = p[0] - 1; west >= 0 && shouldFill(west, p[1]); west--);
         for(east = p[0] + 1; west < width && shouldFill(east, p[1]); east++);

         //Bring them back in range
         west++; east--;

         //NOTE: flood fill doesn't CARE about fancy additional complexity like
         //rectangle drawing or complex line fill, WE are the complexity already
         currentLines.push(new MiniDraw.LineData(1, color, west, p[1], east, p[1]));

         //Don't allow huge fills at all, just quit
         if(currentLines.length > maxLines)
         {
            //TODO: fix this to have better error handling
            alert("Flood fill area too large!");
            currentLines.length = 0;
            break;
         }

         //Now travel from west to east, adding all pixels (we check later anyway)
         for(i = west; i <= east; i++)
         {
            //Just has to be DIFFERENT, not the color we're filling.
            j = MiniDraw.GetIndex(iData, i, p[1]);
            img[j + 3] = (img[j + 3] + 10) & 255;
            //Queue the north and south (regardless of fill requirement)
            queue.push([i, p[1] + 1]);
            queue.push([i, p[1] - 1]);
         }
      }
   }

   iData = null;
   img = null;
   console.log("Flood lines: ", currentLines.length);
};

// -- MAIN STREAMDRAW CREATE/PARSE --

//Note: NONE of the create/parse system things use the overall symbols. The
//container for these streamdraw primitives doesn't matter to the core system.
//All create functions should return the raw stream data to be inserted in a
//container (probably with the symbols defined in this core object)
StreamDrawCore1.prototype.CreateMessage = function(username, message)
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
StreamDrawCore1.prototype.ParseMessage = function(data, start, length)
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

//Parse a single blob of lines within a single stroke or idea or whatever. Just ONE
StreamDrawCore1.prototype.ParseLineChunk = function(data, start, length, type)
{
   if(type == this.symbols.stroke)
      return this.ParseStroke(data, start, length);
   else if(type == this.symbols.lines)
      return this.ParseBatchLines(data, start, length);
   else if(type == this.symbols.rectangles)
      return this.ParseBatchRects(data, start, length);
   else
      throw `Unparseable data type ${type}`;
};

StreamDrawCore1.prototype.CreateStroke = function(lines, ignoredColors, recurseJoiner)
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
StreamDrawCore1.prototype.ParseStroke = function(data, start, length)
{
   var ignoreData = this.ParseIgnoreData(data, start, length);

   start += ignoreData.skip;
   length -= ignoreData.skip;

   var result = [];
   var t, t2; //These are temp variables, used throughout
   var point = this.ParseStandardPoint(data, start);
   var segment = [ point.x, point.y ];
   var color = false;
   var size = StreamConvert.CharsToInt(data, start + point.skip, this.SIZEBYTES);
   var l = point.skip + this.SIZEBYTES;

   if(point.extra)
   {
      t = this.ParseColorData(data, start + l);
      color = t.color;
      l += t.skip;
   }

   while(l < length)
   {
      t = StreamConvert.VariableWidthToInt(data, start + l);
      l += t.length;
      t2 = segment[segment.length - 2] + StreamConvert.SpecialToSigned(t.value);
      segment.push(t2);
   }

   if(segment.length % 2)
   {
      //As often as possible. try to recover from errors.
      console.error("Dangling point on parsed stroke!");
      segment.pop();
   }

   if(segment.length < 2)
   {
      console.error("Parsed stroke too short!");
      return result;
   }

   //Duplicate the last point in case it doesn't line up nicely
   if(segment.length < 4) //This isn't BYTES, it's point data, 4 as in 2 xy points
   {
      x = segment[0];
      y = segment[1]
      segment.push(x, y);
   }

   //Now generate the lines
   for(i = 0; i < segment.length - 2; i += 2)
   {
      result.push(new MiniDraw.LineData(size, color, 
         segment[i], segment[i + 1], segment[i + 2], segment[i + 3], 
         false, ignoreData.complexRect));
   }

   return result;
};

StreamDrawCore1.prototype.CreateBatchLines = function(lines, ignoredColors) {
   return this.CreateGenericBatch(lines, ignoredColors); };

StreamDrawCore1.prototype.ParseBatchLines = function(data, start, length) {
   return this.ParseGenericBatch(data, start, length, false); };

StreamDrawCore1.prototype.CreateBatchRects = function(lines, ignoredColors) {
   return this.CreateGenericBatch(lines, ignoredColors); };

StreamDrawCore1.prototype.ParseBatchRects = function(data, start, length) {
   return this.ParseGenericBatch(data, start, length, true); };

//Lines and rectangles have nearly the same data format!
StreamDrawCore1.prototype.CreateGenericBatch = function(lines, ignoredColors)
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
StreamDrawCore1.prototype.ParseGenericBatch = function(data, start, length, isRect)
{
   var ignoreData = this.ParseIgnoreData(data, start, length);
   start += ignoreData.skip;
   length -= ignoreData.skip;

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
         t.x, t.y, t2.x, t2.y, isRect, ignoreData.complexRect));
   }

   //console.log(result);

   return result;
};

// -- PARTIAL DATA CREATE/PARSE --

StreamDrawCore1.prototype.CreateStandardPoint = function(x, y, extra)
{
   return StreamConvert.IntToChars(
      (extra ? 1 : 0) + ((x & this.xMax) << 1) + ((y & this.yMax) << (1 + this.xShift)), 
      this.POINTBYTES);
};

StreamDrawCore1.prototype.ParseStandardPoint = function(data, start)
{
   var header = StreamConvert.CharsToInt(data, start, this.POINTBYTES);
   return { 
      x : (header >> 1) & this.xMax, 
      y : (header >> (1 + this.xShift)) & this.yMax, 
      extra : header & 1,
      skip : this.POINTBYTES 
   };
};

StreamDrawCore1.prototype.CreateColorData = function(color)
{
   return StreamConvert.IntToChars(parseInt((color || "#000000").replace("#", "0x")),this.COLORBYTES);
};

StreamDrawCore1.prototype.ParseColorData = function(data, start)
{
   return { 
      color : "#" + StreamConvert.CharsToInt(data, start, this.COLORBYTES)
         .toString(16).toUpperCase().padStart(6, "0"),
      skip : this.COLORBYTES
   };
};

//Creating ignore data is a choice, so there are no checks performed to see if
//you "can" create ignore data. You gave us ignore data, we make it.
StreamDrawCore1.prototype.CreateIgnoreData = function(ignoredColors)
{
   //Put colors into the space between the ignores, we'll know it's done
   //when we encounter another ignore character
   var result = this.symbols.ignore;
   ignoredColors.forEach(x => result += this.CreateColorData(x));
   return result + this.symbols.ignore;
};

//Ignore data in a DATASTREAM is optional, and thus we must test for the
//existence of it (checking for symbols isn't normally what we do in these)
StreamDrawCore1.prototype.ParseIgnoreData = function(data, start, length)
{
   if(data.charAt(start) === this.symbols.ignore)
   {
      //There IS data out there that, unfortunately, has this non-ending
      //glitch. If so, just ignore the space.
      var iglength = data.indexOf(this.symbols.ignore, start + 1);
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

   return { skip : 0, complexRect : null };
};


//The "system" is a containerized version of Core which includes pagination
//(for version 1) and further parsing abilities
function StreamDrawSystem1(core, existingData)
{
   this.core = core;

   this.ResetDrawTracking();
   this.ResetMessageTracking();
   this.SetData(existingData);
}

StreamDrawSystem1.prototype.ResetDrawTracking = function()
{
   this.drawPointer = 0;
   this.scheduledLines = [];
   this.maxPage = 0;
};

StreamDrawSystem1.prototype.ResetMessageTracking = function()
{
   this.messagePointer = 0;
   this.scheduledMessages = [];
};

StreamDrawSystem1.prototype.SetData = function(data)
{
   this.rawData = data || "";

   if(this.rawData)
      this.preamble = parsePreamble(data);
   else
      this.preamble = false;
};

StreamDrawSystem1.prototype.CreateMessage = function(username, message)
{
   return this.core.symbols.text + this.core.CreateMessage(username, message);
};

//A critical function: scan through data in chunks to parse out lines. 
StreamDrawSystem1.prototype.ProcessLines = function(scanLimit, page)
{
   var me = this;
   //var totalLines = 0;

   me.core.DataScan(
      me.rawData, 
      Math.max(me.drawPointer, me.preamble.skip), 
      (start, length, cc, end, scanCount) =>
      {
         //Always at least complete ONE round
         me.drawPointer = end;

         //We only handle certain things in draw
         if(cc != me.core.symbols.lines && 
            cc != me.core.symbols.stroke && 
            cc != me.core.symbols.rectangles)
            return false;

         //We ALSO only handle the draw if it's the right PAGE.
         var pageDat = StreamConvert.VariableWidthToInt(me.rawData, start);
         me.maxPage = Math.max(me.maxPage, pageDat.value);

         if(pageDat.value != page)
            return false;

         //Parse the lines, draw them, and update the line count all in one
         //(drawLines returns the lines again). The minus one in length is the
         //ending cap (needs to be removed in DataScan)
         var lines = me.core.ParseLineChunk(me.rawData, start + pageDat.length, length - pageDat.length - 1, cc);
         me.scheduledLines = me.scheduledLines.concat(lines);
         //totalLines += lines.length;

         //return (totalLines > lineLimit) || (scanCount > me.maxScan);
         return scanCount > scanLimit;
      }
   );
};

//The message handler
StreamDrawSystem1.prototype.ProcessMessages = function(scanLimit)
{
   var me = this;

   me.core.DataScan(
      me.rawData, 
      Math.max(me.messagePointer, me.preamble.skip), 
      (start, length, cc, end, scanCount) =>
      {
         //Always at least complete ONE round
         me.messagePointer = end;

         if(cc != me.core.symbols.text)
            return false;

         me.scheduledMessages.push(me.core.ParseMessage(me.rawData, start, length));

         return scanCount > scanLimit;
      }
   );
};

