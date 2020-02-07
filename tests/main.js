
$(document).ready(function()
{
   log("Test start! " + (new Date()).toLocaleString());
   printRandomLetters();
   testRandomLetters();
   testDownload();
});

function log(obj) { console.log(obj); }

function getSection()
{
   var results = $("#results");
   var content = $('<div class="result"></div>');
   results.append(content);
   return content;
}

function testRandomLetters()
{
   var cnt = 40;
   var r, t, l;
   var counts = [];
   for(var i = 0; i < 20000; i++)
   {
      r = randomLetters(cnt);
      for(var j = 0; j < cnt; j++)
      {
         if(!counts[j]) counts[j] = [];
         l = r.charAt(j);
         if(!counts[j][l]) counts[j][l] = 0;
         counts[j][l]++;
      }
   }
   log(counts);
}

function printRandomLetters()
{
   for(var i = 0; i < 40; i++)
      log(randomLetters(10 + i * 2));
}

function testDownload(result)
{
   var sec = getSection();

   for(var i = 0; i < 2200000; i+= 100000)
   {
      var link = $("<a></a>");
      var data = "0123456789".repeat(i / 10);
      link.text(i + " (" + Math.floor(i * 4 / 3) + ")");
      link.attr("href","data:text/plain;charset=utf-8;base64," + btoa(data));
      link.attr("download", "test_"+i+".txt");
      sec.append(link);
   }
}
