
$(document).ready(function()
{
   log("Test start! " + (new Date()).toLocaleString());
   printRandomLetters();
   testRandomLetters();
});

function log(obj) { console.log(obj); }

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
