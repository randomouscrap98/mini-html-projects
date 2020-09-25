$(document).ready(function()
{
   var room = window.location.search.substr(1);

   var form = $("#mainform");
   var container = $("#messageContainer");
   var messages = $("#messages");
   var message = $("#message");
   var username = $("#username");

   message.keydown(function(e)
   {
      if(e.keyCode === 13 && !e.shiftKey)
      {
         e.preventDefault();
         form.submit();
      }
   });

   queryEnd(room, 0, function(data)
   {
      messages.append(document.createTextNode(data));
      container[0].scrollTop = container[0].scrollHeight;
      return data.length;
   });

   form.submit(function()
   {
      var text = username.val() + ": " + message.val() + "\n";
      post(endpoint(room), text);
      message.val("");
      return false;
   });
});

function endpoint(room) { return "/stream/" + room; }

function post(url, data)
{
   var xhr = new XMLHttpRequest();
   xhr.open('POST', url, true);
   xhr.send(data);
}

function queryEnd(room, start, handle)
{
   $.get(endpoint(room) + "?start=" + start)
      .done(function(data) { start += handle(data); })
      .always(function() { queryEnd(room, start, handle); });
}
