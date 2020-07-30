$(document).ready(function()
{
   var form = $("#retweetFinder");
   var result = $("#result");

   form.submit(function()
   {
      result.text("Searching...");
      var inputs = form.find("input");
      inputs.prop("disabled", true);

      findRetweets(getValue(form, "user"), getValue(form, "tweetId"),
         function(data) { displayResults(data, result); })
         .fail(function(error) { displayError(data, result); })
         .always(function() { inputs.prop("disabled", false); });

      return false;
   });
});

function findRetweets(user, tweetId, success)
{
   var args = user + "%20" + tweetId;
   var run = $.getJSON("/danger/?user=random&run=retweets&args=" + args, success);

   return run;
}

function displayResults(data, element)
{
   element.empty();

   if(data.errors)
   {
      displayError(errors, element);
      return;
   }

   displayContent(data.output, element);
}
