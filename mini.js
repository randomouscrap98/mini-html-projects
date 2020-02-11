
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

function any(array, check)
{
   for(var i = 0; i < array.length; i++)
      if(check(array[i], i))
         return true;

   return false;
}

function endpoint(room) { return "/stream/" + room; }

function queryEnd(room, start, handle, error)
{
   var requery = function() { queryEnd(room, start, handle, error); };
   $.getJSON(endpoint(room) + "/json?start=" + start)
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

function post(url, data)
{
   postRetry(url, data, 100, 1000);
}

function postRetry(url, data, retries, timeout)
{
   if(retries <= 0)
      throw "Ran out of post retries!";

   timeout = timeout || 500;

   fetch(url, 
   {
      method: "POST",
      body: data
   }).catch(function(error) 
   {
      console.log("POST " + url + " failed, retries: " + retries);
      setTimeout(function() { postRetry(url, data, retries - 1, timeout); }, timeout);
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

   var preamble = data.substr(1, end + 1);
   var parts = preamble.split(":");

   if(parts.length < 2) return null;

   return { skip: end + 1, name: parts[0], version: parts[1]};
}

function createPreamble(name, version)
{
   return "#" + name + ":" + version + "#";
}

function setRunning(element) { element.css("background-color", "lightgreen"); }
function setError(element) { element.css("background-color", "red"); }

function setSlider(slider, val)
{
   slider.val(val);
   slider.trigger("input");
   slider.trigger("change");
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

