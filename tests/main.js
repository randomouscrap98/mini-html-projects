
$(document).ready(function()
{
   log("Test start! " + (new Date()).toLocaleString());
   printRandomLetters();
   testRandomLetters();
   testDownload();
   testSpecialSigned();
   testVariableLengthEncoding();
});

function log(obj) { console.log(obj); }

function asserteq(a, b, msg)
{
   msg = msg || "";
   console.log(msg + " - Expected: ", b, "Actual: ", a);

   if(a !== b)
      console.error("ASSERT FAIL: " + b + " !== " + a);
}

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

function testSpecialSigned()
{
   var test = function(i, v)
   {
      var result = StreamConvert.SignedToSpecial(i);
      asserteq(result, v, "sign2spec_" + i);
      var back = StreamConvert.SpecialToSigned(result);
      asserteq(back, i, "spec2sign_" + i);
   };

   test(0, 0);
   test(1, 2);
   test(2, 4);
   test(-1, 1);
   test(-2, 3);
   test(55, 110);
   test(-390543, 781085);
}

function testVariableLengthEncoding()
{
   var test = function(i, l)
   {
      var result = StreamConvert.IntToVariableWidth(i);
      asserteq(result.length, l, "int2varl_" + i);
      var back = StreamConvert.VariableWidthToInt(result, 0);
      asserteq(back.value, i, "var2intv_" + i);
      asserteq(back.length, l, "var2intl_" + i);
   };

   test(0, 1);
   test(15, 1);
   test(16, 1);
   test(31, 1);
   test(32, 2);
   test(1000, 2);
   test(1023, 2);
   test(1024, 3);
   test(32767, 3);
   test(32768, 4);
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
