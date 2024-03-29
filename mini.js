
function displayError(error, element)
{
   var errors = $("<div></div>");
   errors.addClass("error");
   errors.text("An error occurred: " + error);
   element.append(errors);
}

function displayContent(data, element)
{
   var content = $("<div></div>");
   content.addClass('content');
   content.text(data);
   element.append(content);
}

function appendScroll(element, data, field)
{
   if(field)
   {
      element[field] += data;
   }
   else
   {
      if(!(data instanceof Element || data instanceof HTMLDocument))
      {
         var elm = document.createElement("div");
         elm.textContent = data;
         data = elm;
      }

      element.appendChild(data);
   }
   element.scrollTop = element.scrollHeight;
}

function shuffleInt(num)
{
   var list = [];
   for(var i = 0; i < num; i++)
      list.push(i);
   return shuffle(list);
}

//Shuffle list IN PLACE
function shuffle(a)
{
   var j, x, i;
   for (i = a.length - 1; i > 0; i--) 
   {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];      //current element value
      a[i] = a[j];   //bring in new value to current
      a[j] = x;      //put current in random place
   }
   return a;
}

function getInput(form, name) { return form.find('[name="' + name + '"]'); }
function getChecked(form, name) { return getInput(form, name)[0].checked; }
function getValue(form, name) { return getInput(form, name).val(); }
function getLines(form, name) { return getValue(form, name).split('\n'); }

function isHidden(elm) { return elm.hasAttribute("data-hidden"); }
function setHidden(elm, hidden) {if(hidden)elm.setAttribute("data-hidden", "");else elm.removeAttribute("data-hidden");}
function hide(elm) { setHidden(elm, true); }
function show(elm) { setHidden(elm, false); }
function toggleHidden(elm) { setHidden(elm, !isHidden(elm)); }

function setDisabled(elm, disabled) {if(disabled)elm.setAttribute("data-disabled", "");else elm.removeAttribute("data-disabled");}
function disable(elm) { setDisabled(elm, true); }
function enable(elm) { setDisabled(elm, false); }

function any(array, check)
{
   for(var i = 0; i < array.length; i++)
      if(check(array[i], i))
         return true;

   return false;
}

function doValueLink(target)
{
   var linked = target.getAttribute("data-link");
   var update = document.getElementById(linked);
   update.value = target.value;
}


function endpoint(room, readonly) { return "https://oboy.smilebasicsource.com/stream/" + room + 
   (readonly ? "?readonlykey=true" : ""); }

//var MiniConfig = {
//   offline : false,
//   offlineRoomData : {}
//};


function queryEnd(room, start, handle, error, readonly)
{
   var requery = function() { queryEnd(room, start, handle, error, readonly); };
   var params = new URLSearchParams();
   params.set("start", start);
   if(readonly) params.set("readonlykey", true);
   $.getJSON(endpoint(room) + "/json?" + params.toString()) //start=" + start)
      .done(function(data) 
      { 
         start += handle(data, start); 
         requery();
      })
      .fail(function(data)
      {
         if(error) error();
         //Requery but later
         setTimeout(requery, 2000);
      });
}

function post(url, data, then, error)
{
   //if(MiniConfig.offline)
   //{
   //   //Offline always posts to the object. we can't store it in localstorage 
   //   //because dumb browsers and their restrictions
   //   if(!MiniConfig.offlineRoomData[
   //}
   //else
   //{
   //   postRetry(url, data, then, error, 100, 1000);
   //}
   postRetry(url, data, then, error, 100, 1000);
}

function postRetry(url, data, then, error, retries, timeout)
{
   if(retries <= 0)
      throw "Ran out of post retries!";

   timeout = timeout || 500;
   //then = then || d => { console.log("POST:",d); return d; };

   fetch(url, 
   {
      method: "POST",
      body: data
   }).then(d =>
   {
      if(then)
         then(d);
      return d;
   }).catch(function(err)
   {
      console.log("POST " + url + " failed, retries left: " + retries);
      if(error) error(err, retries);
      setTimeout(function() { postRetry(url, data, then, error, retries - 1, timeout); }, timeout);
   });
}

function enterSubmits(input, form)
{
   input.keydown(function(e)
   {
      if(e.keyCode === 13 && !e.shiftKey)
      {
         e.preventDefault();
         form.submit();
      }
   });
}

function parsePreamble(data)
{
   if(data.indexOf("#") !== 0) return null;

   var end = data.substr(1).indexOf("#");

   if(end < 0) return null;

   var preamble = data.substr(1, end);
   var parts = preamble.split("|");

   if(parts.length < 2) return null;

   var result = { skip: end + 2, preamble : preamble, name: parts[0], version: parts[1],
      date : parts[2] };
   
   return result;
}

function createPreamble(name, version)
{
   return "#" + [name, version, (new Date()).toISOString()].join("|") + "#";
}

function setRunning(element) { element.css("background-color", "lightgreen"); }
function setError(element) { element.css("background-color", "red"); }

function setSlider(slider, val)
{
   slider.val(val);
   slider.trigger("input");
   slider.trigger("change");
}

function fallbackCopyTextToClipboard(text, success, fail) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
    if(successful) { if(success) success(); }
    else { if(fail) fail(); }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    if(fail) fail();
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text, success, fail) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text, success, fail);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
    if(success) success();
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
    if(fail) fail();
  });
}

//Crappy queue
function Queue(capacity)
{
   this.array = [];
   this.position = 0;

   for(var i = 0; i < capacity; i++)
      this.array.push(0);
}

Queue.prototype.Enqueue = function(value)
{
   this.array[this.position] = value;
   this.position = (this.position + 1) % this.array.length;
};

Queue.prototype.Average = function()
{
   var sum = 0;
   for(var i = 0; i < this.array.length; i++)
      sum += this.array[i];
   return sum / this.array.length;
};

//This works all the way up to 40... like wow.
function randomLetters(count, r)
{
   r = r || Math.random();
   var result = "";
   var w, b = "a".charCodeAt(0);
   for(var i = 0; i < count; i++)
   {
      r = r * 26;
      w = Math.floor(r);
      result += String.fromCharCode(b + w);
      r = r - w;
   }
   return result;
}

function fileSafeDate()
{
   return String(Math.floor(new Date().getTime()/1000));
}

//This assume all ACTUAL draw actions happen on frame rather than 
//on instantaneous input.
function attachBasicDrawerAction(drawer)
{
   drawer.currentX = null;
   drawer.currentY = null;
   drawer.currentlyDrawing = false;

   drawer.ignoreStroke = false;
   drawer.lastOffTarget = false;

   drawer.OnAction = function(data, context)
   {
      if((data.action & CursorActions.Interrupt) || 
         ((data.action & CursorActions.Start) && !data.onTarget))
         drawer.ignoreStroke = true;

      //If you're drawing on the canvas by dragging and we don't want to ignore
      //this line, store the position for later (animation frames pick it up)
      if(data.onTarget && (data.action & CursorActions.Drag) > 0 && !drawer.ignoreStroke)
      {
         if(data.action & CursorActions.Start || drawer.lastOffTarget)
         {
            drawer.lastX = data.x;
            drawer.lastY = data.y;

            if(data.action & CursorActions.Start)
               drawer.startAction = data;
         }

         //console.log("DRAG", data.x, data.y);
         //Always store current position.
         drawer.currentX = data.x;
         drawer.currentY = data.y;
         drawer.currentlyDrawing = true;
         drawer.lastAction = drawer.currentAction;
         drawer.currentAction = data;
      }

      drawer.lastOffTarget = !data.onTarget;

      //If you're ending a drag and not interrupting (meaning a TRUE drag end),
      //we can stop ignoring the stroke. Honestly though, the performer should
      //keep track of a like "stroke id" for us. Consider doing this.
      if ((data.action & (CursorActions.Drag | CursorActions.End | CursorActions.Interrupt)) == 
         (CursorActions.End | CursorActions.Drag))
      {
         drawer.ignoreStroke = false;
         drawer.currentlyDrawing = false;
         drawer.currentAction = null;
      }
   };
}

var MiniDraw = 
{
   //'Private' variables
   _rectignorememoize : [],
   //An object to store a single line
   LineData : function (width, color, x1, y1, x2, y2, rect, complex)
   {
      this.width = width;
      this.color = color;
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.rect = rect;
      this.complex = complex;
   },
   ParseHexColor : function(c)
   {
      return [
         parseInt(c.substr(1,2), 16), 
         parseInt(c.substr(3,2), 16), 
         parseInt(c.substr(5,2), 16),
         c.length == 9 ? parseInt(c.substr(7,2),16) : 255
      ];
   },
   SimpleRect : function(ctx, x, y, w, h, clear, complex)
   {
      //console.log("SIMPLERECT1", x, y, w, h);
      x = Math.round(x); y = Math.round(y);
      if(!w || !h) return;
      //LOTS of if statements, but hopefully those are supremely outshadowed by
      //the drawing time
      if(complex)
      {
         //return;
         //Compute the color to use (the function could ignore this I guess)
         var c = clear ? [0,0,0,0] : MiniDraw.ParseHexColor(ctx.fillStyle); 
         //Get the image data
         var d = ctx.getImageData(x, y, w, h);
         //The complex function should modify the data in-place
         complex(d, c); //Then we reapply it
         ctx.putImageData(d, x, y);
      }
      else if(clear) { ctx.clearRect(x, y, w, h); }
      else { ctx.rect(x, y, w, h); }
   },
   //Draw only IN or OUT of the selective colors 
   ComplexExceptionRect : function(d, color, except)
   {
      var i,j;
      csr_datascan:
      for(i = 0; i < d.data.length; i+=4) 
      {
         for(j = 0; j < except.length; j+=4) 
            if(d.data[i] == except[j] && d.data[i+1] == except[j+1] &&
               d.data[i+2] == except[j+2])// && d.data[i+3] == except[j+3])
               continue csr_datascan;

         d.data[i] = color[0];
         d.data[i+1] = color[1];
         d.data[i+2] = color[2];
         d.data[i+3] = color[3];
      }
   },
   SimpleLine : function (ctx, ld)
   {
      var xdiff = ld.x2 - ld.x1;
      var ydiff = ld.y2 - ld.y1;
      var dist = Math.sqrt(xdiff*xdiff+ydiff*ydiff);
      var ang = Math.atan(ydiff/(xdiff===0?0.0001:xdiff))+(xdiff<0?Math.PI:0); 
      var ofs = (ld.width - 1) / 2;

      if(dist === 0) dist=0.001;

      if(ld.color)
         ctx.fillStyle = ld.color;

      //A nice optimization for flood fill (and perhaps other things?)
      if(Math.abs(ydiff) < 0.1) //A 0.1 diff shouldn't change anything...
      {
         ctx.beginPath();
         //Remember that there is no 'height' because it's all LINE width, so
         //the ld.width used for height makes sense
         MiniDraw.SimpleRect(ctx, Math.min(ld.x1, ld.x2) - ofs, ld.y1 - ofs, 
            Math.abs(xdiff) + ld.width, ld.width, !ld.color, ld.complex);
         ctx.fill();
      }
      else
      {
         var x, y;
         var setx = [], sety = [];
         ctx.beginPath();
         for(var i=0;i<dist;i+=0.5) //0.5) 
         {
            x = Math.round(ld.x1+Math.cos(ang)*i-ofs); 
            y = Math.round(ld.y1+Math.sin(ang)*i-ofs);
            if(setx[x] && sety[y]) continue;
            MiniDraw.SimpleRect(ctx, x, y, ld.width, ld.width, !ld.color, ld.complex);
            setx[x] = 1; sety[y] = 1;
         }
         ctx.fill();
      }
   },
   SimpleRectLine : function(ctx, ld)
   {
      if(ld.rect)
      {
         if(ld.color)
            ctx.fillStyle = ld.color;
         ctx.beginPath();
         MiniDraw.SimpleRect(ctx, Math.min(ld.x1, ld.x2), Math.min(ld.y1, ld.y2),
            Math.abs(ld.x1 - ld.x2), Math.abs(ld.y1 - ld.y2), 
            !ld.color, ld.complex);
         ctx.fill();
      }
      else
      {
         MiniDraw.SimpleLine(ctx, ld);
      }
   },
   GetIndex : function(idata, x, y)
   {
      return 4 * (Math.round(x) + Math.round(y) * idata.width);
   },
   //Generate a function (or null if none provided) for complex line drawing
   //when certain colors are ignored. 'ignored' param must be a list of
   //standard HEX STRING colors, like #FF8899
   GetComplexRectFromIgnore : function (ignored) 
   {
      if(!ignored || ignored.length == 0)
         return null;
      var key = ignored.toString();
      if(!(key in MiniDraw._rectignorememoize))
      {
         console.debug(`memoizing complexrect ignore color list: ${key}`);
         //Convert ignored into proper broken up integers
         var ignored_1d = [];
         ignored.forEach(x => ignored_1d.push(...MiniDraw.ParseHexColor(x)));
         MiniDraw._rectignorememoize[key] = (d,c) => MiniDraw.ComplexExceptionRect(d,c,ignored_1d);
      }
      return MiniDraw._rectignorememoize[key];
   },
   //Perform a flood on the given context at the given point, returning the
   //MiniDraw lines that could be used to represent the flood.
   Flood : function(context, cx, cy, color, maxLines)
   {
      //Do the east/west thing, generate the lines, IGNORE future strokes
      //Using a buffer because working with image data can (does) cause it to go
      //into software rendering mode, which is very slow
      var currentLines = [];
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
      return currentLines;
   }
};

//This is technically less features than original MiniDraw, but you should
//prefer this one over the other for the simplicity, and some of the functions
//may work better
var MiniDraw2 = 
{
   SOLIDRECT : "solidrect",
   INSERTIMAGE : "image",
   BasicLineType : function(type) {
      return { type : type };
   },
   ImageType : function(image) {
      return { type : MiniDraw2.INSERTIMAGE, image : image };
   },
   CreateUntaintedImage : function() {
      var image = new Image();
      image.crossOrigin = "Anonymous";
      return image;
   },
   _MemoizedPatterns : {},
   _MemoizedImages : {},   //CAREFUL! If you have a lot of images this might be mem death?
   _LineContextId : 0,     //Lines are stamped with this context and only drawn if it matches
   //An object to store a single line
   LineData : function (width, color, x1, y1, x2, y2, extra, patternId)
   {
      this.width = width;
      this.color = color;
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.extra = extra;
      this.patternId = patternId || 0;
      this._contextId = MiniDraw2._LineContextId;
   },
   CancelPendingLines : function () {
      MiniDraw2._LineContextId++;
   },
   SetupLineStyle(ctx, ld)
   {
      if(ld.color)
      {
         if(ld.patternId)
         {
            var pkey = `${ld.patternId}_${ld.color}`;

            //WARN! This memoizes ALL patterns! I figure we'll have at most
            //maybe 100, which times 16 pixels is only 1600, which... might be ok?
            //In any case, we could limit the memoizing to maybe 32 and always get
            //rid of the one with the least accesses
            if(!MiniDraw2._MemoizedPatterns[pkey])
            {
               var cv = document.createElement("canvas");
               cv.width = 4; cv.height = 4;
               var cvx = cv.getContext("2d");
               cvx.fillStyle = ld.color;

               for(var i = 0; i < 16; i++)
                  if(ld.patternId & (1 << i))
                     cvx.fillRect(i % 4, Math.floor(i / 4), 1, 1);

               MiniDraw2._MemoizedPatterns[pkey] = ctx.createPattern(cv, "repeat");
               console.log(`Cached pattern ${pkey}`);
            }

            ctx.fillStyle = MiniDraw2._MemoizedPatterns[pkey];
         }
         else
         {
            ctx.fillStyle = ld.color;
         }
      }
   },
   //This function is different because rectangles require more calculation,
   //don't want to mess up the raw linedata
   SimpleRect : function(ctx, x, y, w, h, clear)
   {
      w = Math.round(w); h = Math.round(h);
      x = Math.round(x); y = Math.round(y);
      if(!w || !h) { return; }
      else if(clear) { ctx.clearRect(x, y, w, h); }
      else { ctx.rect(x, y, w, h); }
   },
   SimpleLine : function (ctx, ld)
   {
      var xdiff = ld.x2 - ld.x1;
      var ydiff = ld.y2 - ld.y1;
      var dist = Math.sqrt(xdiff*xdiff+ydiff*ydiff);
      var ang = Math.atan(ydiff/(xdiff===0?0.0001:xdiff))+(xdiff<0?Math.PI:0); 
      var ofs = (ld.width - 1) / 2;

      if(dist === 0) dist=0.001;

      MiniDraw2.SetupLineStyle(ctx, ld);

      //A nice optimization for flood fill (and perhaps other things?)
      if(Math.abs(ydiff) < 0.1) //A 0.1 diff shouldn't change anything...
      {
         ctx.beginPath();
         //Remember that there is no 'height' because it's all LINE width, so
         //the ld.width used for height makes sense
         MiniDraw2.SimpleRect(ctx, Math.min(ld.x1, ld.x2) - ofs, ld.y1 - ofs, 
            Math.abs(xdiff) + ld.width, ld.width, !ld.color);
         ctx.fill();
      }
      else
      {
         var x, y;
         var setx = [], sety = [];
         ctx.beginPath();
         for(var i=0;i<dist;i+=0.5)
         {
            //The filter function SHOULD round for us, but we need it rounded
            //for the setx/sety
            x = Math.round(ld.x1+Math.cos(ang)*i-ofs); 
            y = Math.round(ld.y1+Math.sin(ang)*i-ofs);
            if(setx[x] && sety[y]) continue;
            MiniDraw2.SimpleRect(ctx, x, y, ld.width, ld.width, !ld.color);
            setx[x] = 1; sety[y] = 1;
         }
         ctx.fill();
      }
   },
   //The ACTUAL "draw this line data" function (minidraw2). It's async because
   //some kinds of lines may need to load resources.
   DrawLineDataAsync : async function(ctx, ld)
   {
      //Check the context at the start, this will cancel lines types that are
      //immediate or which were waiting forever quickly
      if(ld._contextId !== MiniDraw2._LineContextId)
         return;
      //{
      //   //console.warn("Skipping out-of-context line: ", ld);
      //}
      if(ld.extra)
      {
         if(ld.extra.type === MiniDraw2.SOLIDRECT)
         {
            MiniDraw2.SetupLineStyle(ctx, ld);
            ctx.beginPath();
            MiniDraw2.SimpleRect(ctx, Math.min(ld.x1, ld.x2), Math.min(ld.y1, ld.y2),
               Math.abs(ld.x1 - ld.x2), Math.abs(ld.y1 - ld.y2), !ld.color);
            ctx.fill();
         }
         else if(ld.extra.type === MiniDraw2.INSERTIMAGE)
         {
            //There's no loaded image yet for this line data, need to go
            //fulfill that.
            if(!ld.extra.image)
            {
               //Oops, not memoized yet. Go do that, and await the result.
               if(!(ld.extra.url in MiniDraw2._MemoizedImages))
               {
                  try {
                     await new Promise((resolve, reject) => {
                        var img = MiniDraw2.CreateUntaintedImage();
                        img.onload = () => {
                           MiniDraw2._MemoizedImages[ld.extra.url] = img;
                           console.log(`Cached image: ${ld.extra.url}`);
                           resolve();
                        };
                        img.onerror = reject;
                        img.src = ld.extra.url;
                     });
                     //Since we awaited, gotta check again. May make this DRY
                     //later, but I need to avoid function calls maybe?
                     if(ld._contextId !== MiniDraw2._LineContextId)
                        return;
                     //{
                     //   console.warn("Skipping out-of-context line: ", ld);
                     //   return;
                     //}
                  }
                  catch(ex) {
                     //Don't let the whole drawing system crash just because an
                     //image couldn't load. Better to just leave it blank and
                     //move on; probably just a dead link or something.
                     console.error(`Could not load image ${ld.extra.url}: ${ex}`);
                     return;
                  }
               }

               //Since we're awaiting a promise up there, we know it'll be in
               //the memoized pool or whatever here.
               ld.extra.image = MiniDraw2._MemoizedImages[ld.extra.url];
               ld.extra.url = false;
            }

            //This draws the image data directly into the canvas using the line
            //data provided. Just like all other things, x1, x2, y1, y2 are the
            //upper left and lower right corners.
            ctx.drawImage(ld.extra.image, Math.min(ld.x1, ld.x2), Math.min(ld.y1, ld.y2),
               Math.abs(ld.x1 - ld.x2), Math.abs(ld.y1 - ld.y2));
         }
         else 
         {
            console.warn("Couldn't figure out what to do with special line: ", ld.extra);
         }
      }
      else
      {
         MiniDraw2.SimpleLine(ctx, ld);
      }
   },
   //Perform a flood on the given context at the given point, returning the
   //MiniDraw lines that could be used to represent the flood. Currently it
   //fails if it goes over the maxLines generated. The "sampleContexts" should
   //be an array of contexts to search through for flood fill ability
   Flood : function(contexts, cx, cy, color, maxLines, patternId)
   {
      //Do the east/west thing, generate the lines, IGNORE future strokes
      //Using a buffer because working with image data can (does) cause it to go
      //into software rendering mode, which is very slow
      var currentLines = [];
      var width = contexts[0].canvas.width;
      var height = contexts[0].canvas.height;
      var getIndex = (ix, iy) => (Math.round(ix) + Math.round(iy) * width);
      var iDatas = contexts.map(x => new Uint32Array(x.getImageData(0, 0, width, height).data.buffer));
      var replaceColors = iDatas.map(x => x[getIndex(cx, cy)]);
      var queue = [[Math.round(cx), Math.round(cy)]];
      var west, east, i, j, k;
      maxLines = maxLines || 999999999;

      console.log("Flood into color: ", replaceColors, cx, cy);

      var cleanup = () => { //Undo the flood
         for(var i = 0; i < currentLines.length; i++)
            for(var j = currentLines[i].x1; j <= currentLines[i].x2; j++)
               iDatas[0][getIndex(j, currentLines[i].y1)] = replaceColors[0];
      };

      var shouldFill = (x, y) =>
      {
         if(x < 0 || y < 0 || x >= width || y >= height)
            return false;

         //Idk, don't create a new variable each time.
         k = getIndex(x, y);

         for(var sfi = 0; sfi < iDatas.length; sfi++)
            if(iDatas[sfi][k] !== replaceColors[sfi])
               return false;

         return true;
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
            currentLines.push(new MiniDraw2.LineData(1, color, west, p[1], east, p[1],
               false, patternId));

            //Don't allow huge fills at all, just quit
            if(currentLines.length > maxLines)
            {
               cleanup();
               alert("Flood fill area too large!");
               currentLines.length = 0;
               break;
            }

            //Now travel from west to east, adding all pixels (we check later anyway)
            for(i = west; i <= east; i++)
            {
               //Just has to be DIFFERENT, not the color we're filling.
               j = getIndex(i, p[1]);
               iDatas[0][j] += 10;
               //Queue the north and south (regardless of fill requirement)
               queue.push([i, p[1] + 1]);
               queue.push([i, p[1] - 1]);
            }
         }
      }

      cleanup(); //Clear all the messed up data we did
      console.log("Flood lines: ", currentLines.length);
      return currentLines;
   }
};

MiniDraw2.LineData.prototype.is_solidrect = function()
{
   return this.extra && (this.extra.type === MiniDraw2.SOLIDRECT);
};

MiniDraw2.LineData.prototype.is_image = function()
{
   return this.extra && (this.extra.type === MiniDraw2.INSERTIMAGE);
};


var StreamConvert =
{
   charStart : 48,
   varVal : 32,
   MaxValue : function(bytes)
   {
      return Math.pow(2, 6 * bytes);
   },
   IntToChars : function (int, chars)
   {
      chars = chars || 1;
      var max = ((1 << (chars * 6)) - 1);

      if(int < 0) int = 0;
      if(int > max) int = max;

      var result = "";

      for(var i = 0; i < chars; i++)
         result += String.fromCharCode(StreamConvert.charStart + ((int >> (i * 6)) & 63));

      return result;
   },
   CharsToInt : function (chars, start, count)
   {
      start = start || 0;
      count = count || chars.length - start;
      var result = 0;
      for(var i = 0; i < count; i++)
         result += (chars.charCodeAt(i + start) - StreamConvert.charStart) << (i * 6);
      return result;
   },
   //A dumb form of 2's compliment that doesn't carry the leading 1's
   SpecialToSigned : function(special)
   {
      if(special & 1)
         return ((special >> 1) * -1) -1
      else
         return special >> 1;
   },
   SignedToSpecial : function(value)
   {
      if(value >= 0)
         return value << 1;
      else
         return ((value << 1) * -1) - 1;
   },
   IntToVariableWidth : function(value)
   {
      var result = "";
      var c = 0;

      do 
      {
         c = value & (StreamConvert.varVal - 1);
         value = value >> 5;
         if(value) c += StreamConvert.varVal;
         result += String.fromCharCode(StreamConvert.charStart + c);
      } 
      while(value > 0);

      return result;
   },
   VariableWidthToInt : function(chars, start)
   {
      var result = {value:0,length:0};
      var c = 0;

      do 
      {
         c = chars.charCodeAt(start + result.length) - StreamConvert.charStart;
         result.value += (c & (StreamConvert.varVal - 1)) << (5 * result.length);
         result.length++;
      } 
      while(c & StreamConvert.varVal);

      return result;
   },
   SignedToVariableWidth : function(value)
   {
      return StreamConvert.IntToVariableWidth(StreamConvert.SignedToSpecial(value));
   },
   VariableWidthToSigned : function(chars, start)
   {
      var result = StreamConvert.VariableWidthToInt(chars, start);
      result.value = StreamConvert.SpecialToSigned(result.value);
      return result;
   }
};

