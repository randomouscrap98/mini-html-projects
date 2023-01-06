// randomouscrap98
// 12-15-2020
// (major overhaul 09-11-2022)

var system = 
{
   name: "journal",
   version: "2.0.2_f3"
};

var globals = 
{
   roomname: "",
   drawer: null,
   context: null,
   pendingStroke: {},
   scheduledScrolls: [],
   scheduledMessages: [],
   scheduledPages: [],
   scheduledLines: [],
   toolRemember: {
      //To make life easier, we put a default eraser rememberance which is
      //three times as large as the regular brush
      "eraser" : { 
         "sizemodifier" : "size3", 
         "sizetext" : "6", 
         "patternselect" : "0"
      }
   },
   pbspeedAccumulator: 0, //ONLY for smoothing autofollow!
   undoBuffer : false,
   layerTop : 0,
   layerLeft : 0
};

var constants =
{
   pwidth : 2000,
   pheight : 4000,
   mwidth : 200,
   mheight : 100,
   roomPrepend : "journal2_",
   settingPrepend : "mini_journal2_",
   maxLines : 5000,        //A single stroke (or fill) can't have more than this
   maxMessageRender : 100, //per frame
   maxScan : 10000,        //per frame; should be about the max line draw per frame
   maxParse : 2000,
   autoDrawLineChunk : 90,//Be VERY CAREFUL with this value! Harmonic series...
   nonDrawTools : [ "exportrect", "pan" ],
   easymodeDefaultTool : "tool_pen",
   slowToolAlpha : 0.15,
   newPageUndos : 30,
   confirmPageTimeout : 5000,
   microScale : 5
};

var palettes = 
{
   "0grafx2" : ["#000000","#0000a8","#00ff00","#fffb00","#82ff00","#00ff7d","#00ffff","#0082ff","#0000ff","#7900ff","#cf00ff","#ff00d7","#ff0082","#ff0000","#ff7d00","#cb9a45","#963c18","#610000","#fff782","#c3ff82","#82ff82","#82ffbe","#82ffff","#82c3ff","#8282ff","#a682ff","#cf82ff","#fb82ff","#ff82c3","#ff8282","#ff9e82","#820000","#821c00","#823c00","#825100","#826500","#827900","#418200","#008200","#00823c","#008282","#004182","#000082","#280082","#4d0082","#790082","#820041","#101010","#202020","#303030","#454545","#555555","#656565","#757575","#868686","#9a9a9a","#aaaaaa","#bababa","#cbcbcb","#dfdfdf","#efefef","#ffffff","#4d0000","#590000","#710000","#860000","#9e0000","#b60000","#cf0000","#e70000","#ff1c1c","#ff3434","#ff5151","#ff6d6d","#ff8a8a","#ffa2a2","#ffbebe","#4d2400","#552800","#6d3400","#863c00","#9e4900","#b65900","#cf6500","#e77100","#ff8e1c","#ff9a34","#ffa651","#ffb26d","#ffbe86","#ffcfa2","#ffdfbe","#4d4900","#595100","#716900","#868200","#9e9600","#b6ae00","#cfc700","#e7e300","#ffff00","#ffff1c","#fffb34","#fffb51","#fff76d","#fffb86","#fffba2","#fffbbe","#004d00","#006100","#007900","#008e00","#00a600","#00ba00","#00d300","#00eb00","#1cff1c","#38ff34","#55ff51","#71ff6d","#8aff86","#a6ffa2","#c3ffbe","#004141","#005959","#007171","#008686","#009e9e","#00b6b6","#00cfcf","#00e7e7","#59fffb","#75fffb","#8affff","#9efffb","#baffff","#cbffff","#dbffff","#002041","#002c59","#003871","#004586","#00519e","#005db6","#0069cf","#0075e7","#1c8eff","#349eff","#51aaff","#6dbaff","#8acbff","#a2d7ff","#bee3ff","#00004d","#000065","#000479","#00048e","#0004a6","#0000be","#0000d3","#0000eb","#1c24ff","#343cff","#515dff","#6d79ff","#8a92ff","#a2aaff","#bec7ff","#24004d","#300065","#410082","#4d009a","#5900b2","#6500cb","#7100e7","#8200ff","#8e1cff","#9634ff","#a651ff","#ae6dff","#be86ff","#cba2ff","#dbbeff","#49004d","#5f0063","#75007a","#8b0090","#a100a7","#b700bd","#cd00d4","#e300eb","#e617ed","#ea2ff0","#ed47f2","#f15ff5","#f476f7","#f88efa","#fba6fc","#ffbeff","#200000","#2c0000","#380404","#490c08","#551410","#612018","#712824","#7d382c","#864538","#9a594d","#aa6d5d","#ba8275","#cb9a8a","#dfb2a2","#efcfbe","#ffebdf","#202000","#3c3c00","#514d00","#655908","#79650c","#8e6d14","#a2791c","#b67d28","#be8238","#c78e4d","#cf9661","#dba675","#e3b28e","#ebc3a6","#f7d3c3","#ac7c7c","#6d6d6d"],
   "blk-neo" : ["#000000","#12173D","#293268","#464B8C","#6B74B2","#909EDD","#C1D9F2","#FFFFFF","#FFCCD0","#F29FAA","#C37289","#994C69","#723352","#3F1F3C","#B22E69","#E54286","#FF6EAF","#FFA5D5","#8CFF9B","#42BC7F","#22896E","#14665B","#0F4A4C","#0A2A33","#1D1A59","#322D89","#354AB2","#3E83D1","#50B9EB","#8CDAFF","#B483EF","#854CBF","#5D2F8C","#431E66","#FFE091","#FFAA6E","#FF695A","#B23C40","#721C2F","#A52639","#DD3745","#FF6675","#78FAE6","#27D3CB","#00AAA5","#008782"],
   "cc-29" : ["#f2f0e5","#b8b5b9","#868188","#646365","#45444f","#3a3858","#212123","#352b42","#43436a","#4b80ca","#68c2d3","#a2dcc7","#ede19e","#d3a068","#b45252","#6a536e","#4b4158","#80493a","#a77b5b","#e5ceb4","#c2d368","#8ab060","#567b79","#4e584a","#7b7243","#b2b47e","#edc8c4","#cf8acb","#5f556a"],
   "default48" : ["#000000","#1e2a33","#374652","#546270","#7a8694","#a2acb8","#c6ced6","#ffffff","#04055c","#0a1c75","#133e8f","#2263a8","#3c8fc2","#5cbbdb","#89dceb","#c0f5fa","#2f034d","#550b6b","#811c8a","#a83298","#c7509a","#e67395","#f39ba3","#ffc2ae","#3d0604","#5c1309","#7a2811","#99441d","#b8682e","#d18e47","#ebb86b","#ffdc97","#470014","#6b0a19","#8f1719","#b32b1f","#d95023","#eb7f2c","#f5b23e","#fee660","#023328","#084d35","#13663c","#208042","#309942","#48b340","#78cc52","#aee660"],
   "duel" : ["#000000","#222323","#434549","#626871","#828b98","#a6aeba","#cdd2da","#f5f7fa","#625d54","#857565","#9e8c79","#aea189","#bbafa4","#ccc3b1","#eadbc9","#fff3d6","#583126","#733d3b","#885041","#9a624c","#ad6e51","#d58d6b","#fbaa84","#ffce7f","#002735","#003850","#004d5e","#0b667f","#006f89","#328ca7","#24aed6","#88d6ff","#662b29","#94363a","#b64d46","#cd5e46","#e37840","#f99b4e","#ffbc4e","#ffe949","#282b4a","#3a4568","#615f84","#7a7799","#8690b2","#96b2d9","#c7d6ff","#c6ecff","#002219","#003221","#174a1b","#225918","#2f690c","#518822","#7da42d","#a6cc34","#181f2f","#23324d","#25466b","#366b8a","#318eb8","#41b2e3","#52d2ff","#74f5fd","#1a332c","#2f3f38","#385140","#325c40","#417455","#498960","#55b67d","#91daa1","#5e0711","#82211d","#b63c35","#e45c5f","#ff7676","#ff9ba8","#ffbbc7","#ffdbff","#2d3136","#48474d","#5b5c69","#73737f","#848795","#abaebe","#bac7db","#ebf0f6","#3b303c","#5a3c45","#8a5258","#ae6b60","#c7826c","#d89f75","#ecc581","#fffaab","#31222a","#4a353c","#5e4646","#725a51","#7e6c54","#9e8a6e","#c0a588","#ddbf9a","#2e1026","#49283d","#663659","#975475","#b96d91","#c178aa","#db99bf","#f8c6da","#002e49","#004051","#005162","#006b6d","#008279","#00a087","#00bfa3","#00deda","#453125","#614a3c","#7e6144","#997951","#b29062","#cca96e","#e8cb82","#fbeaa3","#5f0926","#6e2434","#904647","#a76057","#bd7d64","#ce9770","#edb67c","#edd493","#323558","#4a5280","#64659d","#7877c1","#8e8ce2","#9c9bef","#b8aeff","#dcd4ff","#431729","#712b3b","#9f3b52","#d94a69","#f85d80","#ff7daf","#ffa6c5","#ffcdff","#49251c","#633432","#7c4b47","#98595a","#ac6f6e","#c17e7a","#d28d7a","#e59a7c","#202900","#2f4f08","#495d00","#617308","#7c831e","#969a26","#b4aa33","#d0cc32","#622a00","#753b09","#854f12","#9e6520","#ba882e","#d1aa39","#e8d24b","#fff64f","#26233d","#3b3855","#56506f","#75686e","#917a7b","#b39783","#cfaf8e","#fedfb1","#1d2c43","#2e3d47","#394d3c","#4c5f33","#58712c","#6b842d","#789e24","#7fbd39","#372423","#53393a","#784c49","#945d4f","#a96d58","#bf7e63","#d79374","#f4a380","#2d4b47","#47655a","#5b7b69","#71957d","#87ae8e","#8ac196","#a9d1c1","#e0faeb","#001b40","#03315f","#07487c","#105da2","#1476c0","#4097ea","#55b1f1","#6dccff","#554769","#765d73","#977488","#b98c93","#d5a39a","#ebbd9d","#ffd59b","#fdf786","#1d1d21","#3c3151","#584a7f","#7964ba","#9585f1","#a996ec","#baabf7","#d1bdfe","#262450","#28335d","#2d3d72","#3d5083","#5165ae","#5274c5","#6c82c4","#8393c3","#492129","#5e414a","#77535b","#91606a","#ad7984","#b58b94","#d4aeaa","#ffe2cf","#721c03","#9c3327","#bf5a3e","#e98627","#ffb108","#ffcf05","#fff02b","#f7f4bf"],
   "endesga-64" : ["#ff0040","#131313","#1b1b1b","#272727","#3d3d3d","#5d5d5d","#858585","#b4b4b4","#ffffff","#c7cfdd","#92a1b9","#657392","#424c6e","#2a2f4e","#1a1932","#0e071b","#1c121c","#391f21","#5d2c28","#8a4836","#bf6f4a","#e69c69","#f6ca9f","#f9e6cf","#edab50","#e07438","#c64524","#8e251d","#ff5000","#ed7614","#ffa214","#ffc825","#ffeb57","#d3fc7e","#99e65f","#5ac54f","#33984b","#1e6f50","#134c4c","#0c2e44","#00396d","#0069aa","#0098dc","#00cdf9","#0cf1ff","#94fdff","#fdd2ed","#f389f5","#db3ffd","#7a09fa","#3003d9","#0c0293","#03193f","#3b1443","#622461","#93388f","#ca52c9","#c85086","#f68187","#f5555d","#ea323c","#c42430","#891e2b","#571c27"],
   "journey" : ["#050914","#110524","#3b063a","#691749","#9c3247","#d46453","#f5a15d","#ffcf8e","#ff7a7d","#ff417d","#d61a88","#94007a","#42004e","#220029","#100726","#25082c","#3d1132","#73263d","#bd4035","#ed7b39","#ffb84a","#fff540","#c6d831","#77b02a","#429058","#2c645e","#153c4a","#052137","#0e0421","#0c0b42","#032769","#144491","#488bd4","#78d7ff","#b0fff1","#faffff","#c7d4e1","#928fb8","#5b537d","#392946","#24142c","#0e0f2c","#132243","#1a466b","#10908e","#28c074","#3dff6e","#f8ffb8","#f0c297","#cf968c","#8f5765","#52294b","#0f022e","#35003b","#64004c","#9b0e3e","#d41e3c","#ed4c40","#ff9757","#d4662f","#9c341a","#691b22","#450c28","#2d002e"],
   "juice56" : ["#000005","#ffffff","#c8e1eb","#a5becd","#7891a5","#55647d","#37415a","#191e3c","#14465a","#0f7373","#0fa569","#41cd73","#73ff73","#dc9b78","#b26247","#8c3c32","#5a1423","#370a14","#ffd2a5","#f5a56e","#e66e46","#c3412d","#8c2323","#410041","#7d0041","#aa143c","#d72d2d","#f06923","#ffaa32","#ffe65a","#bed72d","#64a51e","#237d14","#0f5519","#0f3223","#82ffe1","#41d7d7","#14a0cd","#1469c3","#0f379b","#0f0f69","#3c1e8c","#642db4","#a041d7","#e65ae6","#ff8cc8","#4b143c","#820a64","#b4236e","#e65078","#ff8c8c","#ffcdb4","#e69b96","#be6973","#96465f","#6e2850"],
   "lospec500" : ["#10121c","#2c1e31","#6b2643","#ac2847","#ec273f","#94493a","#de5d3a","#e98537","#f3a833","#4d3533","#6e4c30","#a26d3f","#ce9248","#dab163","#e8d282","#f7f3b7","#1e4044","#006554","#26854c","#5ab552","#9de64e","#008b8b","#62a477","#a6cb96","#d3eed3","#3e3b65","#3859b3","#3388de","#36c5f4","#6dead6","#5e5b8c","#8c78a5","#b0a7b8","#deceed","#9a4d76","#c878af","#cc99ff","#fa6e79","#ffa2ac","#ffd1d5","#f6e8e0","#ffffff"],
   "minecraft-64" : ["#a53618","#bf4917","#d07c14","#e3901d","#e3a64b","#ece3b3","#ffff97","#aadb74","#82a859","#3d8a3d","#2b632b","#255525","#106300","#168700","#6eb718","#ccd302","#ffd800","#ff8f00","#fe2a2a","#ff0000","#a61d16","#8f0303","#600606","#110e1d","#30244a","#3c3056","#12269b","#152cb5","#224baf","#2d86ac","#35abd6","#5decf5","#e3f3f3","#eae9eb","#a1a6b6","#8f8f8f","#686868","#4b4b4b","#2f2f2f","#212121","#101010","#1f1c17","#332e25","#7c4536","#966c4a","#b4905a","#a78a49","#916d38","#a05a0b","#6a431f","#413b2f","#725643","#916d55","#cc9978","#cac48c","#69997e","#498293","#2d5662","#19363f","#884f4f","#ef7070","#f4a2bc","#c354cd","#6d2aa7"],
   "natures-embrace-55" : ["#1b141e","#fe935a","#e25322","#a82424","#691b28","#ffbf89","#e7825a","#be5340","#7a321c","#d08058","#974e49","#5a303f","#ffc95c","#eb8a06","#cde042","#68b229","#257d2c","#1b4e44","#7becbf","#38aa91","#29777e","#25446c","#5ed7ef","#2096cd","#2662ab","#303386","#a3ccff","#788dde","#5458c0","#efa1ce","#b66cbe","#74448d","#432f65","#ffb2b2","#ea6d9d","#af407f","#75224a","#eb7171","#b1415c","#e3c4b0","#b18e8e","#74647f","#3e3f64","#dfdd9a","#9caa74","#617b47","#2a4e32","#b8d8d1","#759da9","#526a98","#fdf5f1","#ccc1be","#918692","#5d5b6e","#38384c"],
   "pear36" : ["#5e315b","#8c3f5d","#ba6156","#f2a65e","#ffe478","#cfff70","#8fde5d","#3ca370","#3d6e70","#323e4f","#322947","#473b78","#4b5bab","#4da6ff","#66ffe3","#ffffeb","#c2c2d1","#7e7e8f","#606070","#43434f","#272736","#3e2347","#57294b","#964253","#e36956","#ffb570","#ff9166","#eb564b","#b0305c","#73275c","#422445","#5a265e","#80366b","#bd4882","#ff6b97","#ffb5b5"],
   "pico-8" : ["#000000","#1D2B53","#7E2553","#008751","#AB5236","#5F574F","#C2C3C7","#FFF1E8","#FF004D","#FFA300","#FFEC27","#00E436","#29ADFF","#83769C","#FF77A8","#FFCCAA"],
   "resurrect-64" : ["#2e222f","#3e3546","#625565","#966c6c","#ab947a","#694f62","#7f708a","#9babb2","#c7dcd0","#ffffff","#6e2727","#b33831","#ea4f36","#f57d4a","#ae2334","#e83b3b","#fb6b1d","#f79617","#f9c22b","#7a3045","#9e4539","#cd683d","#e6904e","#fbb954","#4c3e24","#676633","#a2a947","#d5e04b","#fbff86","#165a4c","#239063","#1ebc73","#91db69","#cddf6c","#313638","#374e4a","#547e64","#92a984","#b2ba90","#0b5e65","#0b8a8f","#0eaf9b","#30e1b9","#8ff8e2","#323353","#484a77","#4d65b4","#4d9be6","#8fd3ff","#45293f","#6b3e75","#905ea9","#a884f3","#eaaded","#753c54","#a24b6f","#cf657f","#ed8099","#831c5d","#c32454","#f04f78","#f68181","#fca790","#fdcbb0"],
   "srb2" : ["#ffffff","#f7f7f7","#efefef","#e7e7e7","#dfdfdf","#d7d7d7","#cfcfcf","#c7c7c7","#bfbfbf","#b7b7b7","#afafaf","#a7a7a7","#9f9f9f","#979797","#8f8f8f","#878787","#7f7f7f","#777777","#6f6f6f","#676767","#5f5f5f","#575757","#4f4f4f","#474747","#3f3f3f","#373737","#2f2f2f","#272727","#1f1f1f","#171717","#0f0f0f","#070707","#000000","#bfa78f","#b7a088","#af9880","#a79078","#9f8971","#968169","#8e7961","#86725a","#7e6a52","#75624a","#6d5a42","#65533b","#5d4b33","#54432b","#4c3c24","#43331b","#bf7b4b","#b37347","#ab6f43","#a36b3f","#9b633b","#8f5f37","#875733","#7f532f","#774f2b","#6b4727","#5f4323","#533f1f","#4b371b","#3f2f17","#332b13","#2b230f","#ffebdf","#ffe3d3","#ffdbc7","#ffd3bb","#ffcfb3","#ffc7a7","#ffbf9b","#ffbb93","#ffb383","#f7ab7b","#efa373","#e79b6b","#df9363","#d78b5b","#cf8353","#cb7f4f","#ffeedc","#ffdcb9","#ffcb97","#ffb975","#ffa855","#ff9736","#ff8619","#ff7500","#f36d00","#e56500","#d85d00","#cb5500","#be4d00","#b14500","#a43d00","#973600","#ffffef","#ffffcf","#ffffaf","#ffff8f","#ffff6f","#ffff4f","#ffff2f","#ffff0f","#ffff00","#cfcf00","#afaf00","#8f8f00","#6f6f00","#4f4f00","#2f2f00","#0f0f00","#ffff73","#ebdb57","#d7bb43","#c39b2f","#af7b1f","#9b5b13","#874307","#732b00","#ffdfdf","#ffbfbf","#ff9f9f","#ff7f7f","#ff5f5f","#ff3f3f","#ff1f1f","#ff0000","#ef0000","#df0000","#cf0000","#bf0000","#af0000","#9f0000","#8f0000","#7f0000","#6f0000","#5f0000","#4f0000","#3f0000","#2f0000","#1f0000","#0f0000","#ffb7b7","#f3a3a3","#e78f8f","#db7b7b","#cb6b6b","#bf5b5b","#b34f4f","#a73f3f","#8e2e00","#862700","#7e2000","#751900","#6d1200","#650b00","#5d0500","#550000","#77ff4f","#70f04b","#69e046","#61d041","#5ac03c","#52b037","#4ba032","#43902d","#3c8028","#357023","#2d601e","#265019","#1e4014","#17300f","#0f200a","#070f04","#deffa8","#c7e494","#adc880","#95ad6b","#7c9258","#647744","#4a5a30","#323f1d","#00ff00","#00df00","#00bf00","#009f00","#007f00","#005f00","#003f00","#001f00","#ff6fff","#ff00ff","#df00df","#bf00bf","#9f009f","#7f007f","#5f005f","#3f003f","#e9e9f3","#c4c4e1","#9d9dce","#7777bb","#5454a7","#414183","#2e2e5c","#1b1b34","#d5f1ff","#bfebff","#aae3ff","#95ddff","#80d6ff","#6acfff","#55c8ff","#3fbfff","#379ddf","#2f8fbf","#27779f","#1f5f7f","#00bfbf","#007f7f","#005f5f","#003f3f","#e7e7ff","#c6c6ff","#adadff","#8c8cff","#7373ff","#5252ff","#3131ff","#1818ff","#0000ff","#0000e7","#0000ce","#0000b5","#00009c","#000084","#00006b","#000052","#00004f","#00003f","#000037","#000027","#00001f","#00000f","#000007","#00ffff","#cf7fcf","#b76fb7","#9f5f9f","#874f87","#6f3f6f","#572f57","#3f1f3f","#270f27"],
   "sweet-canyon-extended-64" : ["#0f0e11","#2d2c33","#40404a","#51545c","#6b7179","#7c8389","#a8b2b6","#d5d5d5","#eeebe0","#f1dbb1","#eec99f","#e1a17e","#cc9562","#ab7b49","#9a643a","#86482f","#783a29","#6a3328","#541d29","#42192c","#512240","#782349","#8b2e5d","#a93e89","#d062c8","#ec94ea","#f2bdfc","#eaebff","#a2fafa","#64e7e7","#54cfd8","#2fb6c3","#2c89af","#25739d","#2a5684","#214574","#1f2966","#101445","#3c0d3b","#66164c","#901f3d","#bb3030","#dc473c","#ec6a45","#fb9b41","#f0c04c","#f4d66e","#fffb76","#ccf17a","#97d948","#6fba3b","#229443","#1d7e45","#116548","#0c4f3f","#0a3639","#251746","#48246d","#69189c","#9f20c0","#e527d2","#ff51cf","#ff7ada","#ff9edb"],
   "vinik24" : ["#000000","#6f6776","#9a9a97","#c5ccb8","#8b5580","#c38890","#a593a5","#666092","#9a4f50","#c28d75","#7ca1c0","#416aa3","#8d6268","#be955c","#68aca9","#387080","#6e6962","#93a167","#6eaa78","#557064","#9d9f7f","#7e9e99","#5d6872","#433455"]
};

function windowOnLoad()
{
   try
   {
      var url = new URL(location.href);
      var sidebar = document.getElementById("sidebar");

      computeRoomInfo(url, globals);

      if(!globals.roomname)
      {
         showCover({title:"No room set", text:"Please provide a room using ?room=yourroomname"});
         return;
      }

      if(url.searchParams.get("export") == 1)
      {
         performFunctionalExport(globals.roomname);
         return;
      }

      setupToggleSetting("pageflip", pageflip, 
         () => document.body.setAttribute("data-flipped", ""),
         () => document.body.removeAttribute("data-flipped"));
      setupToggleSetting("pagechat", pagechat, 
         () => show(chat),
         () => hide(chat));
      setupToggleSetting("easymode", easymode);

      //If these need to be done later, it could pose a problem, there's an
      //ordering issue here: static export needs the close button
      setupValueLinks(document);   
      setupClosable(document);

      setupPageControls();
      setupExports();

      globals.contexts = [ 
         layer1.getContext("2d"),
         layer2.getContext("2d")
      ];
      globals.system = createSystem(); 

      handlePageHash(location.hash);

      globals.drawer = setupDrawer(layer1);
      hfliptoggle.oninput = (e) => globals.drawer.SetInvert(hfliptoggle.checked, false, [ layer2 ]);
      setupSpecialControls();

      if(globals.readonly)
      {
         document.body.setAttribute("data-pagereadonly", "");

         //Only show auto on very specifically readonly but reading 
         if(!globals.exported)
         {
            show(autofollow.parentNode);
            autofollow.oninput = (e) =>
            {
               setHidden(playbackmodifier, autofollow.checked);
               setHidden(playbackslider, autofollow.checked);
               setHidden(pagecontrols, autofollow.checked);
            };

            //Use click to enable the oninput
            if(url.searchParams.get("auto") == 1)
               autofollow.click();
         }
      }
      else
      {
         //Note: 'setupPalette' is for the personal custom palette displayed
         //all the time; OTHER palette functions are for the static palette
         //dialog that shows as the default color picker when double clicking
         setupPalette(palette, getSetting("palette") || [
            "#333333","#858585","#D6D6D6", 
            "#016E8F","#00A1D8","#93E3FD",
            "#99244F","#E63B7A","#F4A4C0",
            "#4E7A27","#76BB40","#CDE8B5" ]);
         setupColorControls();
         setupChat();
      }

      //Skip data retrieval if we're exported already
      if(globals.exported)
      {
         //Exported, disable some stuff and don't set up listeners/etc. Can
         //instantly setup the frame function!
         globals.system.SetData(exportData.roomdata);
         frameFunction();
         enable(sidebar);
         refreshInfo();
      }
      else
      {
         pullInitialStream(() =>
         {
            //DON'T start the frame function until we have the initial stream, this isn't an export!
            enable(sidebar);
            startLongPoller();
            frameFunction(); 
         });
      }

      //Setup this crap as late as possible, since it's a generic thing and
      //there could be document generation before this
      setupRadioEmulators(document);
      setupPlaybackControls();
   }
   catch(ex)
   {
      alert("Exception during load: " + ex.message);
      throw ex;
   }
}

window.onload = () => windowOnLoad(false);

function safety(func) { try { func(); } catch(ex) { console.log(ex); } }
function getSetting(name) { return StorageUtilities.ReadLocal(constants.settingPrepend + name) }
function setSetting(name, value) { StorageUtilities.WriteLocal(constants.settingPrepend + name, value); }
function setStatus(status) { percent.setAttribute("data-status", status); }
function shouldAutoFollow() { return globals.readonly && !globals.exported && autofollow.checked; }
function isEasyMode() { return getSetting("easymode"); }
function getPlaybackSpeed() { 
   return Number(playbacktext.value) * 
      Number(playbackmodifier.querySelector("[data-selected]").id.replace("playback",""));
}
function getPage() { return pageselect.value; }
function setPage(v) { 
   if(pageselect.querySelector(`[value="${v}"]`))
   {
      pageselect.value = v; 
      return true;
   }
   return false;
}
function getLayer() { return Number(layerselect.getAttribute("data-layer")); }
function getLineSize() 
{ 
   return Number(sizetext.value) *
      Number(sizemodifier.querySelector("[data-selected]").id.replace("size",""));
}
function getLineColor() { return colortext.value; }
function setPickerColor(c) { colortext.value = c; color.value = c; }
function setLineColor(color) { setPickerColor(color); updateCurrentSwatch(color); }
function getToolName(tool) { return tool.id.replace("tool_", ""); }
function getTool() { 
   var selectedTool = tools.querySelector("[data-selected]");
   if(selectedTool.hasAttribute("disabled"))
      return false;
   else
      return getToolName(selectedTool);
}
function getPattern() { return Number(patternselect.value); }
function toolIsRect(tool) { return tool && (tool.indexOf("rect") >= 0); }
function toolIsErase(tool) { return tool && (tool.indexOf("erase") >= 0); }
function toolIsNonDraw(tool) { return tool && (tool.indexOf("pan") >= 0 || tool.indexOf("export")); }
function toolIsContinuous(tool) { return tool && (tool.indexOf("slow") >= 0); }
function isDropperActive() { return dropper.hasAttribute("data-selected"); }
function setDropperActive(active) 
{ 
   if(active) { dropper.setAttribute("data-selected",""); } 
   else { dropper.removeAttribute("data-selected"); }
}
//These palette functions are for the DIALOG, not user custom palettes
function getPaletteName() { return palettedialog.getAttribute("data-palette"); }
function updatePaletteNumber(inc) {
   var keys = Object.keys(palettes);
   var num = keys.indexOf(getPaletteName()); //if it's not found, it's -1, whatever
   num = (num + inc + keys.length) % keys.length;
   palettedialog.setAttribute("data-palette", keys[num]);
   setSetting("palettechoice", keys[num]);
}
function setLayerOffset(x, y) {
   layer1.style.top = y + "px"; 
   layer1.style.left = x + "px";
   layer2.style.top = y + "px";
   layer2.style.left = x + "px";
}
function getLayerOffset() {
   return {
      x : Number(layer1.style.left.replace("px", "")),
      y : Number(layer1.style.top.replace("px", ""))
   };
}
//Use current state of toolbox to save the current tool settings
function saveToolRemember(toolname) {
   //var tool = getTool();
      //Number(sizemodifier.querySelector("[data-selected]").id.replace("size",""));
   globals.toolRemember[toolname] = {
      "sizemodifier" : document.getElementById("sizemodifier").querySelector("[data-selected]").id,
      "sizetext" : document.getElementById("sizetext").value, 
      "patternselect" : document.getElementById("patternselect").value
   };
   console.log(`Saved tool ${toolname}: `, globals.toolRemember[toolname]);
}
//Restore the given tool (if there's any data)
function restoreToolRemember(toolname) {
   var remembered = globals.toolRemember[toolname];
   if(remembered) {
      document.getElementById(remembered["sizemodifier"]).click();
      var sizeinput = document.getElementById("sizetext");
      sizeinput.value = remembered["sizetext"];
      doValueLink(sizeinput);
      document.getElementById("patternselect").value = remembered["patternselect"];
      console.log(`Restored tool ${toolname}`);
   }
}


function computeRoomInfo(url, storeObject)
{
   storeObject = storeObject || {};

   //Regardless of the rest of things, if we have export data, stop now. 
   if(window.exportData)
   {
      storeObject.roomname = window.exportData.roomname;
      storeObject.roomdata = window.exportData.roomdata;
      storeObject.exported = true;
      storeObject.readonly = true;
   }
   //Second highest priority is view (readonly) 
   else if(url.searchParams.has("view"))
   {
      storeObject.roomname = url.searchParams.get("view");
      storeObject.readonly = true;
      storeObject.exported = false;
   }
   else if(url.searchParams.has("room")) 
   {
      storeObject.roomname = constants.roomPrepend + url.searchParams.get("room");
      storeObject.readonly = false;
      storeObject.exported = false;
   }
   else
   {
      storeObject.roomname = null;
   }
   //else
   //{
   //   //showCover({title:"No room set", text:"Please provide a room using ?room=yourroomname"});
   //   return;
   //}

   //Set roomname to either exportdata first, or the param
   //globals.roomname = window.exportData ? window.exportData.roomname : tempRoom;
   return storeObject;
}

//title, text, showContainer, 
function showCover(config)
{
   setHidden(coverscreentitle, !config.title);
   setHidden(coverscreentext, !config.text);
   setHidden(coverscreencontainer, !config.showContainer);
   var oldClose = getClosable(coverscreen);
   if(oldClose) oldClose.parentNode.removeChild(oldClose);
   if(config.closable || config.onclose) 
   {
      setupClosable(coverscreen);
      if(config.onclose)
      {
         var closebtn = getClosable(coverscreen);
         closebtn.addEventListener("click", config.onclose);
      }
   }
   coverscreentitle.textContent = config.title;
   coverscreentext.textContent = config.text;
   coverscreencontainer.innerHTML = "";
   show(coverscreen);
}
function hideCover() { hide(coverscreen); }

function setupValueLinks(element)
{
   [...element.querySelectorAll("[data-link]")].forEach(x => (x.oninput = e => doValueLink(e.target)) );
}

function makePaletteButton()
{
   var button = document.createElement("button");
   var swatch = document.createElement("div");
   swatch.className = "swatch";
   button.appendChild(swatch);
   return button;
}

function setupPalette(container, colors)
{
   for(var i = 0; i < colors.length; i++)
   {
      var button = makePaletteButton();
      button.addEventListener("click", (e) => 
      {
         //They're clicking on it AGAIN. Toggle the hidden state (a literal toggle)
         if (e.currentTarget.hasAttribute("data-selected"))
         {
            toggleHidden(palettedialog);
         }
         else //Something NEW was clicked, hide the dialog no matter what
         {
            hide(palettedialog);
            //If in easy mode and specifically on an eraser tool, just go ahead and switch 
            //to the pen whenever a color is picked.
            var ctool = getTool();
            if(isEasyMode() && (toolIsErase(ctool) || toolIsNonDraw(ctool)))
            {
               console.debug("Auto swapping to default drawing tool because color selected while erasing");
               document.getElementById(constants.easymodeDefaultTool).click();
            }
         }

         // On ANY palette button click, always update the picker color (this
         // includes the color text at the top of the screen)
         var c = e.currentTarget.getAttribute("data-color");
         setPickerColor(c);
      });
      container.appendChild(button);
      updatePaletteSwatch(button, colors[i]);

      if(i == 0) 
      {
         //Note: set data-selected AFTERWARDS to avoid any special features
         //that happen when selecting a palette button again (like opening the
         //palette dialog)
         button.click();
         button.setAttribute("data-selected", "");
      }
   }
}

//Given ANY palette button (custom user palette or static), update the color
//shown inside and assigned to the button
function updatePaletteSwatch(button, color)
{
   if(color) 
      button.setAttribute("data-color", color);

   button.firstElementChild.style.background = 
      button.getAttribute("data-color");
}

//Call updatePaletteSwatch on the currently selected user custom palette button
function updateCurrentSwatch(color)
{
   updatePaletteSwatch(palette.querySelector("[data-selected]"), color);
   setSetting("palette", [...palette.querySelectorAll("[data-color]")].map(x => x.getAttribute("data-color")));
}

//Set up ANY controls related to color (including the palette dialog)
function setupColorControls()
{
   dropper.onclick = () => setDropperActive(!isDropperActive()) ;
   color.oninput = () => setLineColor(color.value);
   colortext.oninput = () => setLineColor(colortext.value);

   //Go find the origin selection OR first otherwise
   palettedialog.setAttribute("data-palette", getSetting("palettechoice") || Object.keys(palettes)[0]);

   palettedialogleft.onclick = () => { updatePaletteNumber(-1); refreshPaletteDialog(); }
   palettedialogright.onclick = () => { updatePaletteNumber(1); refreshPaletteDialog(); }
   refreshPaletteDialog();
}

function setupSpecialControls()
{
   layerselect.onclick = () =>
   {
      var layer = layerselect.getAttribute("data-layer");
      if(layer === "0")
      {
         layerselect.setAttribute("data-selected", "");
         layerselect.setAttribute("data-layer", "1");
         layerselect.textContent = "◒";
      }
      else
      {
         layerselect.removeAttribute("data-selected");
         layerselect.setAttribute("data-layer", "0");
         layerselect.textContent = "◓";
      }
   };

   panreset.onclick = () =>
   {
      setLayerOffset(0, 0);
   };
}

// Refresh the entire palette display (minus the standard color input) based on
// the "data-palette" attribute
function refreshPaletteDialog()
{
   palettedialogpalette.innerHTML = "";
   var palettename = getPaletteName();
   var palette = palettes[palettename] || palettes[0];
   palettedialogname.textContent = palettename;
   palette.forEach(p =>
   {
      var b = makePaletteButton();
      updatePaletteSwatch(b, p);
      b.addEventListener("click", e =>
      {
         e.preventDefault();
         setLineColor(b.getAttribute("data-color"));
         hide(palettedialog);
      });
      palettedialogpalette.appendChild(b);
   });
}

function setupRadioEmulators(element)
{
   [...element.querySelectorAll("[data-radio]")].forEach(x =>
   {
      [...x.children].forEach(y => {
         y.onclick = () => 
         {
            //before doing the standard radio simulate, check if this is a special
            //radio where we do extra stuff
            if(x.id === "tools" && isEasyMode())
            {
               //Save the old tool
               saveToolRemember(getTool());
               //Restore the new tool
               restoreToolRemember(getToolName(y));
            }
            HTMLUtilities.SimulateRadioSelect(y, x);
         };
      });
   });
}

function setupClosable(element)
{
   var cfunc = x =>
   {
      var closebutton = document.createElement("button");
      closebutton.innerHTML = "&#10005;";
      closebutton.className = "closebutton";
      closebutton.onclick = () => hide(x);
      x.appendChild(closebutton);
   };
   [...element.querySelectorAll("[data-closable]")].forEach(cfunc);
   if(element.hasAttribute && element.hasAttribute("data-closable"))
      cfunc(element);
}

function getClosable(element) { return element.querySelector(".closebutton"); }

function setDrawAbility(ability)
{
   var allTools = [...tools.querySelectorAll("button")];
   var disableTools = allTools.filter(x => !constants.nonDrawTools.includes(getToolName(x)));

   if(ability)
   {
      layer1.setAttribute("data-drawactive", "");
      document.body.setAttribute("data-drawactive", "");
      disableTools.forEach(x => x.removeAttribute("disabled"));
   }
   else
   {
      layer1.removeAttribute("data-drawactive");
      document.body.removeAttribute("data-drawactive");
      disableTools.forEach(x => x.setAttribute("disabled", ""));
   }

   if(ability && globals.undoBuffer)
   {
      show(undobutton);
      show(redobutton);
   }
   else
   {
      hide(undobutton);
      hide(redobutton);
   }
}

//This sets up a storage system on the checkbox given, so the state is
//remembered. It can also run functions based on check state
function setupToggleSetting(name, checkbox, checktrue, checkfalse)
{
   checktrue = checktrue || (() => console.log("Setting " + name));
   checkfalse = checkfalse || (() => console.log("Unsetting " + name));
   var change = e => {
      safety(() => setSetting(name, checkbox.checked));
      if(checkbox.checked)
         checktrue(checkbox, name);
      else
         checkfalse(checkbox, name);
   };
   checkbox.oninput = change;
   //This loads the setting out into the checkbox
   var setting = getSetting(name);
   if(setting !== undefined && setting !== null)
      safety(() => checkbox.checked = setting);
   //This runs the functions required for initial state
   change();
}


function setupPageControls()
{
   var confirmTimer = false;
   var resetnpb = () =>
   {
      newpagebutton.removeAttribute("data-selected");
      newpagebutton.textContent = "New Page";
      hide(micropagedropdown);
   };
   pageselect.oninput = () => changePage(pageselect.value);
   newpagebutton.onclick = () => 
   {
      if(newpagebutton.hasAttribute("data-selected"))
      {
         if(confirmTimer) 
            clearTimeout(confirmTimer);
         resetnpb();
         newpagebutton.setAttribute("disabled", "");
         var pagename = globals.system.NewPageName();
         var newPage = new StreamDrawPageData(pagename);
         if(micropagetoggle.checked)
         {
            newPage.micro = true;
            newPage.undos = constants.newPageUndos;
         }
         post(endpoint(globals.roomname), globals.system.parser.CreatePage(newPage));
         globals.pendingNewPage = pagename;
         globals.pendingSetPage = pagename;
      }
      else
      {
         newpagebutton.setAttribute("data-selected", "");
         newpagebutton.textContent = "Confirm?";
         show(micropagedropdown);
         confirmTimer = setTimeout(resetnpb, constants.confirmPageTimeout);
      }
   };
}

function refreshZoom()
{
   var oldZoom = getSetting("canvassize") || 1;
   var zoom = Number(canvaszoom.value);
   CanvasUtilities.SetScaling(layer1, zoom);
   CanvasUtilities.SetScaling(layer2, zoom);
   setSetting("canvassize", zoom);
   //Do something with panning here
   var lofs = getLayerOffset();
   setLayerOffset(lofs.x * zoom / oldZoom, lofs.y * zoom / oldZoom);
}

function setupPlaybackControls()
{
   canvaszoom.oninput = refreshZoom;
   canvaszoom.value = getSetting("canvassize") || 1;
   refreshZoom();
}

function setupDrawer(canvas)
{
   var drawer = new CanvasPerformer();
   attachBasicDrawerAction(drawer);
   CanvasUtilities.Clear(canvas);
   drawer.Attach(canvas);
   return drawer;
}


// ------------------------------------------------
// -- BEGINNING OF STREAMDRAW SYSTEM INTEGRATION --
// ------------------------------------------------

function createSystem()
{
   return new StreamDrawSystem(
      new StreamDrawSystemParser(
         new StreamDrawElementParser(constants.pwidth, constants.pheight)
      )
   );
}

function exportSinglePage(page, system, redrawPage) //forgetPage)//, system)
{
   var pageData = system.FindPage(page);
   prepPage(pageData, system);

   //We're only going to go through this once.
   var drawTracking = system.InitializeLineScan(page);
   var allLines = [];

   //This scans ALL THE LINES for the given page. Luckily, with our
   //optimizations to the draw system, it only looks at lines within the page
   //range and not ALL lines
   system.ScanLines(drawTracking, l => allLines.push(...l), Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

   //Don't bother sending a context, we're drawing DIRECTLY onto the original pages
   drawLines(allLines);

   //Copy the top layer OVER the bottom layer
   CanvasUtilities.CopyInto(globals.contexts[1], layer1, 0, 0, "source-over");

   var result = false;

   //Need this so images are saved with backgrounds. Can only do it AFTER all
   //drawings, because often times an eraser is used!
   CanvasUtilities.SwapColor(globals.contexts[1], new Color(0,0,0,0), new Color(255,255,255,1), 0);
   result = layer2.toDataURL("image/png", "-moz-parse-options:png-zlib-level=9;transparency=none");

   //This should reset layer2 for us. We already have the data URL
   if(redrawPage)
      changePage(getPage());

   return result;
}

//Assume we're using the basic layers
function setDrawSize(system, width, height)
{
   system.parser.eparser.SetSize(width, height);
   layer1.width = width;
   layer1.height = height;
   layer2.width = width;
   layer2.height = height;
   refreshZoom();
}

function prepPage(pageData, system)
{
   if(pageData.micro)
   {
      setDrawSize(system, constants.mwidth, constants.mheight);
   }
   else
   {
      setDrawSize(system, constants.pwidth, constants.pheight);
   }

   CanvasUtilities.Clear(layer1);
   CanvasUtilities.Clear(layer2);
}

//This might be a dumb function idk. Increment is by default the amount to
//change the page, but if 'exact' is set to true, increment will be EXACTLY the
//page to set rather than just the offset.
function changePage(name) //increment, exact)
{
   //Even though there's the potential for that glitch where a pending page
   //change never gets found, you HAVE to only allow page changes when the
   //scanner is complete! We'll handle dangling pending pages with the scanner
   //tracking!
   if(globals.system.ScanAtEnd())
   {
      if(!setPage(name))
      {
         console.warn("Tried to set page to non-existent name! Resetting page to none instead");
         name = null;
      }

      var newPageData = globals.system.FindPage(name) || {};
      var lastPageData = globals.system.FindPage(globals.lastPageName) || {};

      prepPage(newPageData, globals.system);

      if(lastPageData.micro !== newPageData.micro && globals.lastPageName)
      {
         var zoomDiff = newPageData.micro ? constants.microScale : -constants.microScale;
         canvaszoom.selectedIndex = MathUtilities.MinMax(canvaszoom.selectedIndex + zoomDiff, 0, canvaszoom.length - 1);
         canvaszoom.oninput();
         setLayerOffset(0, 0);
      }

      var drawAbility = globals.system.IsLastPage(name) && !globals.readonly;

      if(newPageData.micro)
      {
         globals.undoBuffer = new UndoBuffer(newPageData.undos);
      }
      else
      {
         globals.undoBuffer = false;
      }

      setDrawAbility(drawAbility);

      globals.pendingSetPage = null;
      globals.scheduledLines = []; //Remove anything waiting to be drawn, this is a new page
      globals.lastPageName = name;

      if(!name)
      {
         location.hash = "";
         globals.drawTracking = false;
      }
      else
      {
         location.hash = "page-" + name;
         globals.drawTracking = globals.system.InitializeLineScan(name);
      }
   }
   else
   {
      console.warn("Can't set page yet: pages aren't present!");
      globals.pendingSetPage = name;
   }
}

function handlePageHash(hash)
{
   var match = hash.match(/page-(.+)/i);

   //With the new system, if we're not ON a page, then no drawing should happen
   if(match)
      globals.pendingSetPage = match[1];
   else
      setDrawAbility(false);
}

function setupChat()
{
   var form = $("#messageform");
   enterSubmits($("#message"), form);
   var isAutoUseraname = () => autousernamedatetime.checked;

   autousernamedatetime.onchange = function()
   {
      $("#username").prop("disabled", isAutoUseraname());
      setSetting("autousernamedatetime", isAutoUseraname());
   };

   if(getSetting("autousernamedatetime"))
      autousernamedatetime.click();

   form.submit(function()
   {
      //Automatically set the username
      if(isAutoUseraname())
      {
         var d = new Date();
         var zs = (v,ln) => String(v).padStart(ln || 2, "0");
         username.value = `${d.getFullYear()}${zs(d.getMonth() + 1)}${zs(d.getDate())}.${zs(
            d.getHours())}${zs(d.getMinutes())}`;
      }
         
      post(endpoint(globals.roomname), globals.system.parser.CreateMessage(username.value, message.value));
      message.value = "";
      return false;
   });
}

function setupExports()
{
   var url = new URL(location.href);
   url.searchParams.set("export", "1");
   document.getElementById("export").href = url.toString();
   exportstatic.onclick = (e) =>
   {
      e.preventDefault();
      performStaticExport();
   };
   exportsingle.onclick = (e) =>
   {
      e.preventDefault();
      exportSection(new MiniDraw2.LineData(false, false, 0, 0, layer1.width, layer1.height));
   };
}

function performStaticExport()
{
   var activeUrls = [];
   showCover({
      title: "Static Export",
      showContainer: true,
      onclose : () => 
      {
         while(activeUrls.length)
         {
            console.log(`Releasing download blob ${activeUrls.length}`);
            window.URL.revokeObjectURL(activeUrls.pop());
         }
      }
   });
   appendScroll(coverscreencontainer, "** NOTE: export size is heavily optimized on Firefox only! **");

   var makeDownload = (data, name, filename) =>
   {
      var blob = new Blob([data], {type:"text/plain;charset=utf-8"});
      activeUrls.push(window.URL.createObjectURL(blob));
      var downloadLink = document.createElement("a");
      downloadLink.textContent = `Download ${name}`;
      downloadLink.href = activeUrls[activeUrls.length - 1];
      downloadLink.download = filename;
      downloadLink.style.display = "block";
      appendScroll(coverscreencontainer, downloadLink);
   };

   var sys = createSystem();
   sys.SetData(globals.system.rawData);

   //A fun hack so there's no ending script tag in the html
   var scriptTag = "script";

   //It will never be higher than 8000 (I think). We do both html AND svg export!
   var svg = HTMLUtilities.CreateSvg(constants.pwidth,constants.pheight); 
   var htmlexport = document.implementation.createHTMLDocument();
   htmlexport.body.innerHTML = `
<meta charset="UTF-8">
<style>
body { width: 2700px; font-family: sans-serif; margin: 8px; padding: 0; }
.pane { display: inline-block; margin: 0 10px; padding: 0; vertical-align: top;}
#textbox { width: 600px; background-color: #FCFCFC; } 
#imagebox > * { display: block; }
#infobox { background: #F7F7F7; padding: 10px; margin-bottom: 15px; }
#infobox h3 { margin-top: 0; }
#imagebox img { image-rendering: moz-crisp-edges; image-rendering: crisp-edges;
   image-rendering: optimizespeed; image-rendering: pixelated;
   border: 1px solid #EEE; }
.pageid { background: #EEE; padding: 5px; padding-left: 10px; }
.username { font-weight: bold; margin-right: 0.25em; }
.keyword { color: deeppink; }
.username::after { content: ":"; }
.wholemessage { padding: 1px 3px; }
.striped:nth-child(even) { background-color: #F7F7F7; }
.exported { color: #777; font-size: 0.8em; display: block; margin: 7px 0 3px 0;
   font-style: italic; }
</style>
<${scriptTag}>
function hashtag(e) { e.preventDefault(); }
window.onload = function() {
   [...document.querySelectorAll("img")].forEach(
      x => x.width = (x.hasAttribute("data-micro") ? (${constants.mwidth} * ${constants.microScale}) : ${constants.pwidth}) / window.devicePixelRatio);
};
</${scriptTag}>
<div id="leftpane" class="pane">
   <div id="imagebox"></div>
</div>
<div id="rightpane" class="pane">
   <div id="infobox">
      <h3>${globals.roomname}</h3>
      <time>${sys.preamble.date}</time>
      <time class="exported">Exported: ${(new Date()).toISOString()}</time>
   </div>
   <div id="textbox"></div>
</div>`;

   var textbox = htmlexport.getElementById("textbox");
   var imagebox = htmlexport.getElementById("imagebox");

   //OK so first, we have to perform a standard scan to get all the relevant
   //data. We can ignore page events, because we only care about the page data
   //that the system will track for us after all scanning is complete.
   var allMessages = [];

   appendScroll(coverscreencontainer, "Parsing initial data...");
   sys.Scan(m => allMessages.push(m), false, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

   //Have to do this repeat parsing in order to reduce memory usage.
   var pageIndex = 0;
   var normalIndex = 0;
   var microIndex = 0;
   var ready = true;
   var microPageCount = 0;
   var normalPageCount = 0;
   sys.pages.forEach(x => { if(x.micro) microPageCount++; else normalPageCount++; });
   var svgWidthMod = Math.ceil(constants.pheight / constants.pwidth);
   var svgSquareN = Math.ceil(Math.sqrt(normalPageCount / svgWidthMod));
   var microSvgWidth = constants.mwidth; //(constants.mwidth * constants.microScale);
   var microSvgHeight = constants.mheight; //(constants.mheight * constants.microScale);
   var microSvgTotalHeight = microSvgHeight * 1.25;
   var svgHeight = svgSquareN * constants.pheight;
   var microPerColumn = Math.floor(svgHeight / microSvgTotalHeight);
   var microColumns = Math.ceil(microPageCount / microPerColumn);
   var svgMicroStartX = svgSquareN * constants.pheight;
   //Yes, both dimensions are supposed to be height. Pages are taller than they are wide
   var svgWidth = svgMicroStartX + microSvgWidth * microColumns;

   svg.setAttribute("width", svgWidth);
   svg.setAttribute("height", svgHeight);

   var wait = setInterval(() =>
   {
      if(ready)
      {
         ready = false;

         var page = sys.pages[pageIndex++];
         var pageURI = exportSinglePage(page.name, sys);

         //The html element
         var pageID = document.createElement("a");
         pageID.id = "page_" + pageIndex;
         pageID.className = "pageid";
         pageID.innerHTML = `Page ${pageIndex} (${page.name})`;
         pageID.href = "#" + pageID.id;
         imagebox.appendChild(pageID);
         var image = document.createElement("img");
         image.setAttribute('src', pageURI);
         if(page.micro) image.setAttribute("data-micro", "");
         imagebox.appendChild(image);

         //The svg element
         var simage = HTMLUtilities.CreateSvgElement("image");
         var svgx = (normalIndex % (svgSquareN * svgWidthMod)) * constants.pwidth;
         var svgy =  Math.floor(normalIndex / (svgSquareN * svgWidthMod)) * constants.pheight;
         var svgImageWidth = constants.pwidth;
         var svgImageHeight = constants.pheight;

         if(page.micro)
         {
            svgx = svgMicroStartX + Math.floor(microIndex / microPerColumn) * microSvgWidth;
            svgy = (microIndex % microPerColumn) * microSvgTotalHeight;
            svgImageWidth = microSvgWidth;
            svgImageHeight = microSvgHeight;
            simage.setAttribute("style", "image-rendering:crisp-edges; image-rendering:optimizespeed; image-rendering: pixelated;");
         }
         
         simage.setAttribute("x", svgx);
         simage.setAttribute("y", svgy);
         simage.setAttribute("width", svgImageWidth);
         simage.setAttribute("height", svgImageHeight);
         simage.setAttributeNS('http://www.w3.org/1999/xlink','href', pageURI);
         svg.appendChild(simage);

         //The page text for svg
         var stext = HTMLUtilities.CreateSvgElement("text");
         stext.appendChild(document.createTextNode(`${pageIndex} : ${page.name}`));
         if(page.micro)
         {
            stext.setAttribute("x", svgx + 5);
            stext.setAttribute("y", svgy + svgImageHeight + 12); //12 is the font size... idk
            stext.setAttribute("style", "fill: #444444; font-size: 12px;");
         }
         else
         {
            stext.setAttribute("x", svgx + svgImageWidth - 225);
            stext.setAttribute("y", svgy + svgImageHeight - 25);
            stext.setAttribute("style", "fill: #444444; stroke: #888888; font-size: 24px;");
         }
         svg.appendChild(stext);

         //an outline for images
         var srect = HTMLUtilities.CreateSvgElement("rect");
         srect.setAttribute("x", svgx);
         srect.setAttribute("y", svgy);
         srect.setAttribute("width", svgImageWidth);
         srect.setAttribute("height", svgImageHeight);
         srect.setAttribute("style", "stroke-width:1px;stroke:#DDDDDD;fill:none;");
         svg.appendChild(srect);

         if(page.micro)
            microIndex++;
         else
            normalIndex++;

         appendScroll(coverscreencontainer, `Page ${pageIndex}`);
         ready = true;
      }

      if(pageIndex >= sys.pages.length)
      {
         appendScroll(coverscreencontainer, "Finalizing...");
         changePage(getPage());
         clearInterval(wait);

         allMessages.forEach(x => textbox.appendChild(createMessageElement(x)));

         //Finalize SVG. Set viewbox just in case (it's not necessary but it
         //helps with scaling if you need it later)
         HTMLUtilities.FillSvgBackground(svg, "white");
         svg.setAttribute("viewBox", `0 0 ${svg.getAttribute("width")} ${svg.getAttribute("height")}`);
         makeDownload(svg.outerHTML, "SVG (Images only)", `${globals.roomname}.svg`);

         //Modify svg to produce a "quarter" svg (useful for zoomed out stuff)
         svg.setAttribute("width", Number(svg.getAttribute("width")) / 4);
         svg.setAttribute("height", Number(svg.getAttribute("height")) / 4);
         makeDownload(svg.outerHTML, "SVG (Quarter size)", `${globals.roomname}_quarter.svg`);

         makeDownload(htmlexport.documentElement.outerHTML, "HTML", `${globals.roomname}_static.html`);
      }
   }, 100);
}

function performFunctionalExport(room)
{
   //First, throw up the cover screen
   showCover({ 
      title: "Functional Export",
      showContainer: true
   });

   appendScroll(coverscreencontainer, "Please wait, downloading + stitching data + scripts");

   //Then, go download all the header stuff and jam them into their respective elements
   var styles = document.head.querySelectorAll('link[rel="stylesheet"]');
   var scripts = document.head.querySelectorAll('script');

   var stylesLeft = styles.length, scriptsLeft = scripts.length;

   var finalize = () =>
   {
      appendScroll(coverscreencontainer, `Remaining Scripts: ${scriptsLeft}, Styles: ${stylesLeft}`);
      if(!(stylesLeft == 0 && scriptsLeft == 0)) return;

      //We can't close the functional export screen (since we mangled the html)
      //so... oops, this is a little janky
      hide(coverscreen);
      var htmlBlob = new Blob([document.documentElement.outerHTML], {type:"text/plain;charset=utf-8"});
      show(coverscreen);
      appendScroll(coverscreencontainer, "Export complete! You can close the window when you're done");
      var activeUrl = window.URL.createObjectURL(htmlBlob);
      var downloadLink = document.createElement("a");
      downloadLink.textContent = "Download Functional HTML";
      downloadLink.href = activeUrl;
      downloadLink.download = `${room}_full.html`;
      downloadLink.style.display = "block";
      appendScroll(coverscreencontainer, downloadLink);
   };

   $.get(endpoint(room), data => 
   { 
      var preamble = parsePreamble(data);

      //Scripts MUST come AFTER data (since we need to insert it INTO a script)
      [...scripts].forEach(x =>
      {
         $.get(x.src, d =>
         { 
            if(x.src.indexOf("journal.js") >= 0)
            {
               console.log("MATCH: ", x.src);
               d = 'var exportData = { roomname: ' + JSON.stringify(room) + 
                   ', roomdata: \n' + JSON.stringify(data) + '\n};\n' + d;
            }

            x.innerHTML = d;
            x.removeAttribute("src");
            scriptsLeft--;
            finalize(); 
         });
      });

      //This won't do anything, but we should always make sure...
      //what if there are NO scripts and NO styles?
      finalize(); 
   });

   [...styles].forEach(x =>
   {
      $.get(x.href, d =>
      { 
         var s = document.createElement("style");
         s.innerHTML = d;
         document.head.appendChild(s);
         x.parentNode.removeChild(x);
         stylesLeft--;
         finalize(); 
      });
   });
}

function copySection(ld)
{
   var copyLayer = l => CanvasUtilities.CreateCopy(l, true, 
      Math.min(ld.x1, ld.x2), Math.min(ld.y1, ld.y2), 
      Math.abs(ld.x1 - ld.x2), Math.abs(ld.y1 - ld.y2));
   var el1 = copyLayer(layer1); 
   var el2 = copyLayer(layer2); 

   //Now, you'll need to copy layer 1 OVER layer 2
   var exportCanvas = el2;
   var exportContext = exportCanvas.getContext("2d");

   //When copying, preserve transparency so it looks like it does normally
   CanvasUtilities.CopyInto(exportContext, el1, 0, 0, "source-over");

   //Still need a white background
   CanvasUtilities.SwapColor(exportContext, new Color(0,0,0,0), new Color(255,255,255,1), 0);
   exportCanvas.className = "pixelated";
   return exportCanvas;
}

function exportSection(ld)
{
   if(ld.x1 - ld.x2 == 0 || ld.y1 - ld.y2 == 0)
   {
      console.warn("Tried to export 0 width/height section, ignoring");
      return;
   }

   var expcanv = copySection(ld); 
   showCover({
      title: "Region Export",
      showContainer: true,
      closable: true
   });

   var explink = document.createElement("a");
   explink.href = expcanv.toDataURL();
   explink.download = `${globals.roomname}_${fileSafeDate()}.png`;
   explink.className = "block text";
   explink.textContent = "Download " + explink.download;

   var klandBucket = document.createElement("input");
   klandBucket.setAttribute("type", "text");
   klandBucket.setAttribute("placeholder", "Kland bucket");
   klandBucket.value = getSetting("lastKlandBucket") || "";

   var klandUpload = document.createElement("button");
   klandUpload.textContent = "Upload to kland";
   klandUpload.onclick = () =>
   {
      expcanv.toBlob(blob =>
      {
         var data = new FormData();
         var bucket = klandBucket.value;
         data.append("image", blob, explink.download);
         if(bucket) data.append("bucket", bucket);
         setSetting("lastKlandBucket", bucket); //always set it, in case you want to clear it
         fetch("https://kland.smilebasicsource.com/uploadimage" , { method: "POST", body: data })
            .then(r => r.text())
            .then(t => 
            {
               var klandLink = document.createElement("a");
               klandLink.textContent = t;
               klandLink.href = t;
               klandLink.setAttribute("target", "_blank");
               appendScroll(coverscreencontainer, klandLink);
            })
            .catch(err =>
            {
               var klandError = document.createElement("div");
               klandError.textContent = "Upload error";
               klandError.className = "error";
               appendScroll(coverscreencontainer, klandError);
            });
      });
   };

   var klandContainer = document.createElement("div");
   klandContainer.className = "flexrow";
   klandContainer.appendChild(klandBucket);
   klandContainer.appendChild(klandUpload);

   var totalContainer = document.createElement("div");
   totalContainer.className = "paddedrows";
   totalContainer.appendChild(expcanv);
   totalContainer.appendChild(explink);
   totalContainer.appendChild(klandContainer);
   appendScroll(coverscreencontainer, totalContainer);
}

function refreshInfo(data)
{
   if(data)
   {
      percenttext.innerHTML = (100 * (data.used / data.limit)).toFixed(2) + "%";
      percentbar.style.width = (75 * data.used / data.limit) + "px";
      viewonly.href = "?view=" + data.readonlykey;
   }

   version.innerHTML = system.version;
}

function pullInitialStream(continuation)
{
   //Go out and get initial data. If it's empty, we alert to creating the
   //new data, then reload the page (it's just easier). Otherwise, we
   //pull the (maybe huge) initial blob 
   var url = endpoint(globals.roomname) + "/json?nonblocking=true";
   if(globals.readonly) url += "&readonlykey=true";
   $.getJSON(url)
      .done(data =>
      {
         if(data.used == 0)
         {
            if(globals.readonly)
            {
               showCover({title:"Bad room key",text:"No viewable room here"});
               return;
            }
            else if(confirm("This appears to be a brand new journal, are you sure you want to create one here?"))
            {
               //POST the preamble and move on to reload
               post(endpoint(globals.roomname), 
                  createPreamble(system.name, system.version),
                  d => location.reload());
               return;
            }
         }
         else
         {
            globals.system.SetData(data.data);

            if(!(globals.system.preamble && globals.system.preamble.version && 
                 globals.system.preamble.name == system.name &&
                 globals.system.preamble.version.endsWith("f3")))
            {
               showCover({
                  title: "Incompatible format", 
                  text: "This room/journal appears to be in an incorrect format (bad preamble)"
               } );
            }

            //We already set our data, don't need to do it again
            //TODO: fix this weirdness!
            successfulDataCallback(data);

            if(continuation) 
               continuation();
         }
      })
      .fail(data =>
      {
         showCover({title: "Couldn't pull initial data chunk."});
      });
}

function startLongPoller()
{
   //console.log(globals);
   queryEnd(globals.roomname, globals.system.rawData.length, (data, start) =>
   {
      globals.system.rawData += data.data;
      successfulDataCallback(data);
      return data.data.length;
   }, () =>
   { 
      setStatus("error");
   }, globals.readonly);
}


function successfulDataCallback(data)
{
   setStatus("ok");
   refreshInfo(data);
}


//For now, the big function that generates the generic "lines" the journal
//uses. The journal doesn't care about alpha or aliasing or any of that, it
//only draws collections of pixel perfect lines.
function trackPendingStroke(drw, pending)
{
   //If the pending stroke isn't active, activate it (since they're asking for generation)
   if(!pending.active)
   {
      pending.active = true;
      pending.accepting = true;
      pending.displayAtEnd = false;
      pending.postLines = true;
      pending.size = getLineSize();
      pending.tool = getTool();
      pending.pattern = getPattern(); //brushToPattern(getBrush());
      pending.layer = getLayer();
      pending.erasing = toolIsErase(pending.tool); 
      pending.color = pending.erasing ? null : getLineColor();
      pending.lines = [];
      pending.continuous = toolIsContinuous(pending.tool);
   }

   var currentLines = [];

   //There are times when an active stroke will not accept new lines (because
   //it's too long or something, for instance a huge flood fill)
   if(pending.accepting && pending.tool)
   {
      //Simple stroke
      if(pending.tool == "eraser" || pending.tool == "pen" || pending.tool == "slow")
      {
         pending.type = "stroke"; 

         var ld = new MiniDraw2.LineData(pending.size, pending.color,
            Math.round(drw.lastX), Math.round(drw.lastY), 
            Math.round(drw.currentX), Math.round(drw.currentY),
            false, pending.pattern); 

         if(pending.tool == "slow")
         {
            //Reset average
            if(!pending.lines.length)
            {
               drw.avgX = drw.currentX;
               drw.avgY = drw.currentY;
            }

            ld.x1 = Math.round(drw.avgX);
            ld.y1 = Math.round(drw.avgY);

            drw.avgX = drw.avgX*(1-constants.slowToolAlpha)+drw.currentX*constants.slowToolAlpha;
            drw.avgY = drw.avgY*(1-constants.slowToolAlpha)+drw.currentY*constants.slowToolAlpha;

            ld.x2 = Math.round(drw.avgX);
            ld.y2 = Math.round(drw.avgY);
         }

         currentLines.push(ld);
      }
      //Complex big boy fill
      else if(pending.tool == "fill")
      {
         pending.type = "lines"; //globals.system.core.symbols.lines;
         pending.size = 1;
         pending.accepting = false; //DON'T do any more fills on this stroke!!
         var context1 = layer1.getContext("2d");
         var context2 = layer2.getContext("2d");
         var floodLines = MiniDraw2.Flood([ context1, context2 ],
            drw.currentX, drw.currentY, pending.color, constants.maxLines,
            pending.pattern);
         currentLines.push(...floodLines);
      }
      else if (toolIsRect(pending.tool))
      {
         pending.type = "rectangles"; //globals.system.core.symbols.rectangles;
         pending.displayAtEnd = true;

         if(pending.tool == "exportrect")
            pending.postLines = false;

         //If this is the first line, create it. otherwise, keep updating the
         //secondary thing. We don't need "current lines" because a rect fill
         //is literally just one rectangle
         if(!pending.lines.length)
         {
            pending.lines.push(new MiniDraw2.LineData(pending.size, pending.color,
               Math.round(Math.max(drw.currentX,0)), Math.round(Math.max(drw.currentY,0)),
               Math.round(Math.max(drw.currentX,0)), Math.round(Math.max(drw.currentY,0)), 
               true, pending.pattern));
         }
         else
         {
            pending.lines[0].x2 = Math.round(Math.max(drw.currentX,0));
            pending.lines[0].y2 = Math.round(Math.max(drw.currentY,0));
         }
      }

      //if the amount of lines we're about to add is too much, remove from the
      //current lines
      if(pending.lines.length + currentLines.length > constants.maxLines)
      {
         console.warn("Too many lines! Pending: ", pending.lines.length, " Next: ", currentLines.length);
         currentLines.splice(constants.maxLines - pending.lines.length);
         pending.accepting = false;
      }

      pending.lines.push(...currentLines);
   }

   return currentLines;
}

function drawLines(lines, context, overridecolor) 
{ 
   //console.log("Drawing: " + lines.length + " lines");
   lines.forEach(x => 
   {
      if(overridecolor)
         x.color = overridecolor;
      var layer = x.layer === undefined ? getLayer() : x.layer; //IS THIS SAFE??
      var ctx = context || globals.contexts[layer];
      MiniDraw2.SimpleRectLine(ctx, x);
   });
   return lines; 
}

function selectRect(sx, sy, cx, cy)
{
   selectrectangle.style.display = "block";
   selectrectangle.style.left = Math.min(sx, cx);
   selectrectangle.style.top = Math.min(sy, cy);
   selectrectangle.style.width = Math.abs(sx - cx);
   selectrectangle.style.height = Math.abs(sy - cy);
}

function clearSelectRect()
{
   selectrectangle.style.display = "none";
}

var ffst = 0;
var perfmon = 1; //Set this to like 10000 to do single page draw

//Just schedule them for later
function messageEvent(m) { globals.scheduledMessages.push(m); }
function pageEvent(p) { globals.scheduledPages.push(p); }
function lineEvent(l) { globals.scheduledLines.push(...l); }

function frameFunction()
{
   if(perfmon > 1)
      ffst = performance.now();

   if(globals.scheduledScrolls.length > 0)
   {
      globals.scheduledScrolls.forEach(x => x.scrollTop = x.scrollHeight);
      globals.scheduledScrolls = [];
   }
   if(globals.scheduledMessages.length > 0)
   {
      var fragment = new DocumentFragment();
      //This MODIFIES the array!
      var displayMessages = globals.scheduledMessages.splice(0, constants.maxMessageRender * perfmon);
      displayMessages.forEach(x => fragment.appendChild(createMessageElement(x)));
      messages.appendChild(fragment);
      globals.scheduledScrolls.push(messagecontainer);
   }
   //Now draw lines based on playback speed (if there are any)
   if(globals.scheduledLines.length > 0)
   {
      var pbspeed = 0;

      if(shouldAutoFollow())
      {
         //This was taken from the original draw system. It's a method for
         //drawing smoother lines when the data is disconnected. it just looks
         //more natural... kind of. It slows down the end of the line so the
         //other lines have time to catch up, but speeds up if there's too much
         //going on, in an attempt to even out the drawing at 1:1
         globals.pbspeedAccumulator += Math.max(0.5, 
            Math.pow(globals.scheduledLines.length, 1.0) / 30);
         console.log(globals.pbspeedAccumulator, globals.scheduledLines.length);
         pbspeed = Math.floor(globals.pbspeedAccumulator);
         globals.pbspeedAccumulator -= pbspeed;
         //Math.min(Math.ceil(globals.scheduledLines.length / constants.autoDrawLineChunk), constants.maxParse);
      }
      else
      {
         //Will it matter that we're setting this junk every frame? IDK
         globals.pbspeedAccumulator = 0;
         pbspeed = getPlaybackSpeed();
      }

      // no point trying to splice something that's 0 items pulled out
      if(pbspeed > 0)
         drawLines(globals.scheduledLines.splice(0, pbspeed * perfmon));
   }

   //Only do drawing stuff on frame if there IS a drawer.
   if(globals.drawer)
      drawerTick(globals.drawer, globals.pendingStroke);

   var tracker = globals.system.Scan(messageEvent, pageEvent, constants.maxParse * perfmon, constants.maxScan * perfmon);

   //There are some things we do when we get to the end that can ONLY happen
   //here! For instance, we only complete a pending changePage at the END of
   //scanning so we know if we're truly the last page. 
   if(tracker.atEnd)
   {
      //We ONLY handle pages at the end of scanning so we can be sure of all
      //the properties (such as last page). This also reduces flashing on
      //initial load, as the initial load will only complete the page events
      //once at the very end. This ALSO prevents the bug where a pending page
      //change may not complete, because changePage only works if we're at the
      //end.
      if(globals.scheduledPages.length > 0)
      {
         globals.scheduledPages.forEach(x =>
         {
            var option = document.createElement("option");
            option.value = x.name;
            option.innerHTML = `${x.number}:${x.name}`;
            pageselect.appendChild(option);
            if(x.name === globals.pendingNewPage)
            {
               newpagebutton.removeAttribute("disabled");
               globals.pendingNewPage = null;
            }
         });

         //We want the page to be the last page all the time. I don't want to add
         //an "am I at the end of scanning" check, because it's possible for the
         //last page event to happen long before the actual end of the scan
         if(shouldAutoFollow())
         {
            globals.pendingSetPage = globals.system.GetLastPageName();
            console.log("Auto follow changing to page " + globals.pendingSetPage);
         }

         //This  may cause the page to flash but for now, it's safer. we'll come
         //up with something better later... The reason the flashing
         //is ok is that, the journal isn't made for multiple users at once.
         //flashing pages will almost never happen. Also, if there's a pending
         //set page (could be from anything), NOW is the time to change to it
         //anyway.
         changePage(globals.pendingSetPage || getPage());
         globals.scheduledPages = [];
      }
   }

   if(globals.drawTracking)
   {
      globals.system.ScanLines(globals.drawTracking, lineEvent, 
         constants.maxParse * perfmon, constants.maxScan * perfmon);
   }

//StreamDrawSystem.prototype.ScanLines = function(scanTracker, lineEvent, parseLimit, scanLimit)
   //globals.system.ProcessMessages(constants.maxParse * perfmon, constants.maxScan * perfmon);
   
   //The incoming draw data handler
   //var tracking = globals.system.ProcessLines(constants.maxParse * perfmon, constants.maxScan * perfmon, getPage());


   //AHA, we're doing autofollow! lots of complex crap. First thing, we change
   //to a new page if the data received is in another place
   //if(shouldAutoFollow())
   //{
   //   //If we found ANYTHING, we need to start doing auto stuff. This is
   //   //because the drawing program optimizes away lines that aren't on the
   //   //page, but WE need to follow the page, so if it scanned ANYTHING, we
   //   //need to know about it and update our personal state
   //   if (tracking.scanCount > 0) 
   //   {
   //      console.log("doing auto stuff", tracking, globals.system.scheduledLines.length);
   //      var scrollTop = -Number(scrollblock.style.top.replace("px",""));
   //      var windowrect = document.getElementById("window").getBoundingClientRect();
   //      var scrollrect = scrollblock.getBoundingClientRect();
   //      var scale = scrollrect.height / constants.pheight;
   //      var autobuf = constants.autoScrollBuffer * scale;
   //      var trueMinY = tracking.lastMinY * scale;
   //      var trueMaxY = tracking.lastMaxY * scale;

   //      //oops, pge isn't correct
   //      if(getPage() != tracking.lastPage)
   //      {
   //         //Changing the page resets the tracking!
   //         changePage(tracking.lastPage, true);
   //         //It's ok to continue this function, there's nothing to do.
   //      }
   //      //Oops, we're out of scroll area. Do it per big parse chunk to reduce
   //      //jumping around (it'll still jump around a bit)
   //      else if(trueMinY < scrollTop)
   //      {
   //         scrollblock.style.top = -Math.max(0, trueMinY - autobuf) + "px";
   //      }
   //      else if(trueMaxY > scrollTop + windowrect.height)
   //      {
   //         scrollblock.style.top = -(Math.min(scrollrect.height, trueMaxY + autobuf) 
   //            - windowrect.height) + "px";
   //      }
   //   }

   //   //But this happens any time we're auto
   //   pbspeed = Math.min(Math.ceil(globals.system.scheduledLines.length / constants.autoDrawLineChunk),
   //      constants.maxParse);
   //}

   if(perfmon > 1 && performance.now() - ffst > 10)
      console.log("draw chunk: ", (performance.now() - ffst));

   requestAnimationFrame(frameFunction);
}

//The drawing function to be performed per frame
function drawerTick(drawer, pending)
{
   //Do NOTHING if the drawer is basically inactive! There's nothing to do on
   //each tick unless the drawer is trying to do things!
   if(drawer.currentX !== null) // && drawer.currentX !== undefined)
   {
      //Dropper overrides other actions
      if(isDropperActive())
      {
         doDropper(drawer.currentX, drawer.currentY);

         //This is a lot just to stop the stroke
         drawer.ignoreStroke = true;
         drawer.currentX = null;
      }
      else
      {
         //This creates pending lines from our current drawing tool/etc for
         //posting later. The generated lines are drawn NOW though, so the line
         //data must be correct/working/etc (including stuff like complex func)
         drawLines(trackPendingStroke(drawer, pending));

         //These are NOT performed every frame because the drawing events are
         //NOT synchronized to the frame, so we could be removing that very
         //important "lastX lastY" data
         drawer.lastX = drawer.currentX;
         drawer.lastY = drawer.currentY;

         //if the current line is supposed to keep tracking even when not
         //moving, then don't stop the tracking.
         if(!pending.continuous)
         {
            drawer.currentX = null;
            drawer.currentY = null;
         }
      }
   }

   if(drawer.currentlyDrawing)
   {
      var currentTool = getTool();
      if(toolIsRect(currentTool))
      {
         selectRect(drawer.startAction.clientX, drawer.startAction.clientY,
            drawer.currentAction.clientX, drawer.currentAction.clientY);
      }
      else if(currentTool === "pan")
      {
         var xMove = drawer.currentAction.clientX - drawer.startAction.clientX;
         var yMove = drawer.currentAction.clientY - drawer.startAction.clientY;
         setLayerOffset(globals.layerLeft + xMove, globals.layerTop + yMove);
      }
   }
   //Not currently drawing, post lines since we're done (why is this in the frame drawer again?)
   else
   {
      //Hopefully this doesn't become a performance concern
      clearSelectRect();
      var layerOffset = getLayerOffset();
      globals.layerTop = layerOffset.y; 
      globals.layerLeft = layerOffset.x;

      //Stop drawing?
      drawer.currentX = null;

      //Don't need to continuously look at the pending stroke when there is none
      if(pending.active)
      {
         if(pending.tool == "exportrect")
            exportSection(pending.lines[0]);

         //This saves us in a few ways: some tools don't actually generate lines!
         if(pending.lines.length > 0 && pending.postLines)
         {
            var ldata = globals.system.parser.CreateLines(pending.type,
               pending.layer, pending.lines, pending.ignoredColors);
            post(endpoint(globals.roomname), ldata, () => setStatus("ok"), () => setStatus("error"));
            if(pending.displayAtEnd)
               drawLines(pending.lines);
         }
         pending.active = false;
         pending.lines = [];
      }
   }
}

function doDropper(x, y)
{
   //var ctx = copyToBackbuffer(globals.drawer._canvas);
   var color = CanvasUtilities.GetColor(globals.contexts[0], x, y);

   //If layer 1 invisible here, check bottom layer
   if(!color.a)
      color = CanvasUtilities.GetColor(globals.contexts[1], x, y);
   //console.log("Dropper: ", color);

   //Don't activate the dropper on non-colors
   if(color.a)
   {
      setLineColor(color.ToHexString());
      setDropperActive(false);
   }
}

function hashtag(e)
{
   e.preventDefault();
   alert("Coming soon: " + e.currentTarget.textContent);
}

function createMessageElement(parsed)
{
   var msgelem = document.createElement("span");
   msgelem.className = "message";
   msgelem.textContent = parsed.message;
   msgelem.innerHTML = msgelem.innerHTML.replace(/\b(https?:\/\/[^ ]+)/gi, '<a target="_blank" href="$1">$1</a>');
   msgelem.innerHTML = msgelem.innerHTML.replace(/(#[a-z]+)/gi, '<a href="$1" class="keyword" onclick="hashtag(event);">$1</a>');

   var username = document.createElement("span");
   username.className = "username"; // noflex";
   username.title = parsed.username;

   var um = parsed.username.match(/^(\d{4})(\d{2})(\d{2})\.(\d{2})(\d{2})$/);
   if(um)
   {
      var d = new Date(`${um[1]}-${um[2]}-${um[3]}T${um[4]}:${um[5]}`);
      username.textContent = d.toLocaleDateString().replaceAll('/','-');
   }
   else
   {
      username.textContent = parsed.username;
   }

   var msgcontainer = document.createElement("div");
   msgcontainer.className = "striped wholemessage"; // flexrow";
   msgcontainer.appendChild(username);
   msgcontainer.appendChild(msgelem);

   return msgcontainer;
}

