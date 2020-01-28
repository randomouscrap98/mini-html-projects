
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

function queryEnd(room, start, handle)
{
   $.get(endpoint(room) + "?start=" + start)
      .done(function(data) { start += handle(data); })
      .always(function() { queryEnd(room, start, handle); });
}

function post(url, data)
{
   var xhr = new XMLHttpRequest();
   xhr.open('POST', url, true);
   xhr.send(data);
}
