$(document).ready(function()
{
   var form = $("#randomize");
   var result = $("#result");

   form.submit(function()
   {
      result.text("Generating...");
      var inputs = form.find("input, textarea");
      inputs.prop("disabled", true);

      randomize(getLines(form, "users"), !getChecked(form, "noself"), !getChecked(form, "notrade"), result);
      inputs.prop("disabled", false);

      return false;
   });
});

function isSelf(v, i)
{
   return v === i;
}

function hasTrade(a)
{
   for(var i = 0; i < a.length; i++)
   {
      if(a[a[i]] === i)
         return true;
   }

   return false;
}

function randomize(names, allowSelf, allowTrades, element)
{
   var tries = 0;
   var random = null; 

   if(names.length < 2 && !allowSelf)
   {
      displayError("With only one name, you will always assign to self!", element);
      return;
   }
   if(names.length < 3 && !allowTrades)
   {
      displayError("With two or fewer names, you will always have a trade!", element);
      return;
   }
   
   while(!random)
   {
      random = shuffleInt(names.length);

      if(!allowSelf && any(random, isSelf) || !allowTrades && hasTrade(random))
         random = null;

      tries++;
   }

   element.empty();

   var output = "tries: " + tries + "\n\n";

   for(var i = 0; i < names.length; i++)
   {
      output += names[i] + " - " + names[random[i]] + "\n";
   }

   displayContent(output, element);
}

