// randomouscrap98
// 12-15-2020

var system = 
{
   name: "journal",
   version: "1.0.0_f2" //format 2
};

var globals = 
{
   roomdata: "",
   roomname: "",
   preamble: {},
   chatpointer: 0,
   drawpointer: 0,
   drawer: null,
   context: null,
   maxPage : 0,
   pendingStroke: {},
   scheduledLines: [],
   scheduledScrolls: []
};

var constants =
{
   pwidth : 1000,
   pheight : 8000,
   roomPrepend : "journal_",
   settingPrepend : "mini_journal_",
   maxLines : 5000,        //A single stroke (or fill) can't have more than this
   maxMessageRender : 100, //per frame
   maxScan : 50000,        //per frame
};

var palettes = 
{
   "0grafx2" : ["#000000","#0000a8","#00ff00","#fffb00","#82ff00","#00ff7d","#00ffff","#0082ff","#0000ff","#7900ff","#cf00ff","#ff00d7","#ff0082","#ff0000","#ff7d00","#cb9a45","#963c18","#610000","#fff782","#c3ff82","#82ff82","#82ffbe","#82ffff","#82c3ff","#8282ff","#a682ff","#cf82ff","#fb82ff","#ff82c3","#ff8282","#ff9e82","#820000","#821c00","#823c00","#825100","#826500","#827900","#418200","#008200","#00823c","#008282","#004182","#000082","#280082","#4d0082","#790082","#820041","#101010","#202020","#303030","#454545","#555555","#656565","#757575","#868686","#9a9a9a","#aaaaaa","#bababa","#cbcbcb","#dfdfdf","#efefef","#ffffff","#4d0000","#590000","#710000","#860000","#9e0000","#b60000","#cf0000","#e70000","#ff1c1c","#ff3434","#ff5151","#ff6d6d","#ff8a8a","#ffa2a2","#ffbebe","#4d2400","#552800","#6d3400","#863c00","#9e4900","#b65900","#cf6500","#e77100","#ff8e1c","#ff9a34","#ffa651","#ffb26d","#ffbe86","#ffcfa2","#ffdfbe","#4d4900","#595100","#716900","#868200","#9e9600","#b6ae00","#cfc700","#e7e300","#ffff00","#ffff1c","#fffb34","#fffb51","#fff76d","#fffb86","#fffba2","#fffbbe","#004d00","#006100","#007900","#008e00","#00a600","#00ba00","#00d300","#00eb00","#1cff1c","#38ff34","#55ff51","#71ff6d","#8aff86","#a6ffa2","#c3ffbe","#004141","#005959","#007171","#008686","#009e9e","#00b6b6","#00cfcf","#00e7e7","#59fffb","#75fffb","#8affff","#9efffb","#baffff","#cbffff","#dbffff","#002041","#002c59","#003871","#004586","#00519e","#005db6","#0069cf","#0075e7","#1c8eff","#349eff","#51aaff","#6dbaff","#8acbff","#a2d7ff","#bee3ff","#00004d","#000065","#000479","#00048e","#0004a6","#0000be","#0000d3","#0000eb","#1c24ff","#343cff","#515dff","#6d79ff","#8a92ff","#a2aaff","#bec7ff","#24004d","#300065","#410082","#4d009a","#5900b2","#6500cb","#7100e7","#8200ff","#8e1cff","#9634ff","#a651ff","#ae6dff","#be86ff","#cba2ff","#dbbeff","#49004d","#5f0063","#75007a","#8b0090","#a100a7","#b700bd","#cd00d4","#e300eb","#e617ed","#ea2ff0","#ed47f2","#f15ff5","#f476f7","#f88efa","#fba6fc","#ffbeff","#200000","#2c0000","#380404","#490c08","#551410","#612018","#712824","#7d382c","#864538","#9a594d","#aa6d5d","#ba8275","#cb9a8a","#dfb2a2","#efcfbe","#ffebdf","#202000","#3c3c00","#514d00","#655908","#79650c","#8e6d14","#a2791c","#b67d28","#be8238","#c78e4d","#cf9661","#dba675","#e3b28e","#ebc3a6","#f7d3c3","#ac7c7c","#6d6d6d"],
   "blk-neo" : ["#000000","#12173D","#293268","#464B8C","#6B74B2","#909EDD","#C1D9F2","#FFFFFF","#FFCCD0","#F29FAA","#C37289","#994C69","#723352","#3F1F3C","#B22E69","#E54286","#FF6EAF","#FFA5D5","#8CFF9B","#42BC7F","#22896E","#14665B","#0F4A4C","#0A2A33","#1D1A59","#322D89","#354AB2","#3E83D1","#50B9EB","#8CDAFF","#B483EF","#854CBF","#5D2F8C","#431E66","#FFE091","#FFAA6E","#FF695A","#B23C40","#721C2F","#A52639","#DD3745","#FF6675","#78FAE6","#27D3CB","#00AAA5","#008782"],
   "cc-29" : ["#f2f0e5","#b8b5b9","#868188","#646365","#45444f","#3a3858","#212123","#352b42","#43436a","#4b80ca","#68c2d3","#a2dcc7","#ede19e","#d3a068","#b45252","#6a536e","#4b4158","#80493a","#a77b5b","#e5ceb4","#c2d368","#8ab060","#567b79","#4e584a","#7b7243","#b2b47e","#edc8c4","#cf8acb","#5f556a"],
   "endesga-64" : ["#ff0040","#131313","#1b1b1b","#272727","#3d3d3d","#5d5d5d","#858585","#b4b4b4","#ffffff","#c7cfdd","#92a1b9","#657392","#424c6e","#2a2f4e","#1a1932","#0e071b","#1c121c","#391f21","#5d2c28","#8a4836","#bf6f4a","#e69c69","#f6ca9f","#f9e6cf","#edab50","#e07438","#c64524","#8e251d","#ff5000","#ed7614","#ffa214","#ffc825","#ffeb57","#d3fc7e","#99e65f","#5ac54f","#33984b","#1e6f50","#134c4c","#0c2e44","#00396d","#0069aa","#0098dc","#00cdf9","#0cf1ff","#94fdff","#fdd2ed","#f389f5","#db3ffd","#7a09fa","#3003d9","#0c0293","#03193f","#3b1443","#622461","#93388f","#ca52c9","#c85086","#f68187","#f5555d","#ea323c","#c42430","#891e2b","#571c27"],
   "journey" : ["#050914","#110524","#3b063a","#691749","#9c3247","#d46453","#f5a15d","#ffcf8e","#ff7a7d","#ff417d","#d61a88","#94007a","#42004e","#220029","#100726","#25082c","#3d1132","#73263d","#bd4035","#ed7b39","#ffb84a","#fff540","#c6d831","#77b02a","#429058","#2c645e","#153c4a","#052137","#0e0421","#0c0b42","#032769","#144491","#488bd4","#78d7ff","#b0fff1","#faffff","#c7d4e1","#928fb8","#5b537d","#392946","#24142c","#0e0f2c","#132243","#1a466b","#10908e","#28c074","#3dff6e","#f8ffb8","#f0c297","#cf968c","#8f5765","#52294b","#0f022e","#35003b","#64004c","#9b0e3e","#d41e3c","#ed4c40","#ff9757","#d4662f","#9c341a","#691b22","#450c28","#2d002e"],
   "lospec500" : ["#10121c","#2c1e31","#6b2643","#ac2847","#ec273f","#94493a","#de5d3a","#e98537","#f3a833","#4d3533","#6e4c30","#a26d3f","#ce9248","#dab163","#e8d282","#f7f3b7","#1e4044","#006554","#26854c","#5ab552","#9de64e","#008b8b","#62a477","#a6cb96","#d3eed3","#3e3b65","#3859b3","#3388de","#36c5f4","#6dead6","#5e5b8c","#8c78a5","#b0a7b8","#deceed","#9a4d76","#c878af","#cc99ff","#fa6e79","#ffa2ac","#ffd1d5","#f6e8e0","#ffffff"],
   "pear36" : ["#5e315b","#8c3f5d","#ba6156","#f2a65e","#ffe478","#cfff70","#8fde5d","#3ca370","#3d6e70","#323e4f","#322947","#473b78","#4b5bab","#4da6ff","#66ffe3","#ffffeb","#c2c2d1","#7e7e8f","#606070","#43434f","#272736","#3e2347","#57294b","#964253","#e36956","#ffb570","#ff9166","#eb564b","#b0305c","#73275c","#422445","#5a265e","#80366b","#bd4882","#ff6b97","#ffb5b5"],
   "pico-8" : ["#000000","#1D2B53","#7E2553","#008751","#AB5236","#5F574F","#C2C3C7","#FFF1E8","#FF004D","#FFA300","#FFEC27","#00E436","#29ADFF","#83769C","#FF77A8","#FFCCAA"],
   "resurrect-64" : ["#2e222f","#3e3546","#625565","#966c6c","#ab947a","#694f62","#7f708a","#9babb2","#c7dcd0","#ffffff","#6e2727","#b33831","#ea4f36","#f57d4a","#ae2334","#e83b3b","#fb6b1d","#f79617","#f9c22b","#7a3045","#9e4539","#cd683d","#e6904e","#fbb954","#4c3e24","#676633","#a2a947","#d5e04b","#fbff86","#165a4c","#239063","#1ebc73","#91db69","#cddf6c","#313638","#374e4a","#547e64","#92a984","#b2ba90","#0b5e65","#0b8a8f","#0eaf9b","#30e1b9","#8ff8e2","#323353","#484a77","#4d65b4","#4d9be6","#8fd3ff","#45293f","#6b3e75","#905ea9","#a884f3","#eaaded","#753c54","#a24b6f","#cf657f","#ed8099","#831c5d","#c32454","#f04f78","#f68181","#fca790","#fdcbb0"],
   "vinik24" : ["#000000","#6f6776","#9a9a97","#c5ccb8","#8b5580","#c38890","#a593a5","#666092","#9a4f50","#c28d75","#7ca1c0","#416aa3","#8d6268","#be955c","#68aca9","#387080","#6e6962","#93a167","#6eaa78","#557064","#9d9f7f","#7e9e99","#5d6872","#433455"]
};

window.onload = function()
{
   try
   {
      var url = new URL(location.href);
      var sidebar = document.getElementById("sidebar");

      if(!globals.roomname)
         globals.roomname = constants.roomPrepend + (url.searchParams.get("room") || "");

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

      //If these need to be done later, it could pose a problem, there's an
      //ordering issue here: static export needs the close button
      setupValueLinks(document);   
      setupClosable(document);

      setupPageControls();
      setupExports();

      HTMLUtilities.SimulateScrollbar(scrollbar, scrollbarbar, scrollblock, true);
      globals.context = drawing.getContext("2d");

      handlePageHash(location.hash);

      if(!document.body.hasAttribute("data-export"))
      {
         if(!globals.roomname || globals.roomname == constants.roomPrepend)
         {
            showCover({title:"No room set", text:"Please provide a room using ?room=yourroomname"});
            return;
         }

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
         globals.drawer = setupDrawer(drawing);
         globals.system = new StreamDrawCore1(constants.pwidth, constants.pheight);
         setupToggleSetting("drawtoggle", drawtoggle, 
            () => setDrawAbility(globals.drawer, drawing, true),
            () => setDrawAbility(globals.drawer, drawing, false));
         hfliptoggle.oninput = (e) => globals.drawer.SetInvert(hfliptoggle.checked);

         pullInitialStream(() =>
         {
            //DON'T start the frame function until we have the initial stream, this isn't an export!
            enable(sidebar);
            startLongPoller();
            frameFunction(); 
         });
      }
      else
      {
         //Exported, disable some stuff and don't set up listeners/etc. Can
         //instantly setup the frame function!
         frameFunction();
         enable(sidebar);
         refreshInfo();
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
};

function safety(func) { try { func(); } catch(ex) { console.log(ex); } }
function getSetting(name) { return StorageUtilities.ReadLocal(constants.settingPrepend + name) }
function setSetting(name, value) { StorageUtilities.WriteLocal(constants.settingPrepend + name, value); }
function setStatus(status) { percent.setAttribute("data-status", status); }
function getPlaybackSpeed() { 
   return Number(playbacktext.value) * 
      Number(playbackmodifier.querySelector("[data-selected]").id.replace("playback",""));
}
function getPageNumber() { return Number(pagenumber.textContent) - 1; }
function setPageNumber(v) { pagenumber.textContent = v+1; }
function getLineSize() 
{ 
   return Number(sizetext.value) *
      Number(sizemodifier.querySelector("[data-selected]").id.replace("size",""));
}
function getLineColor() { return colortext.value; }
function setPickerColor(c) { colortext.value = c; color.value = c; }
function setLineColor(color) { setPickerColor(color); updateCurrentSwatch(color); }
function getTool() { return tools.querySelector("[data-selected]").id.replace("tool_", ""); }
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
//Retrieve the list of STRING (ie regular color hex value) colors to ignore
function getIgnoredColors() {
   var colors = document.querySelectorAll("#palette [data-ignore]");
   return [...colors].map(x => x.getAttribute("data-color"));
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
      var ignorebubble = document.createElement("div");
      ignorebubble.className = "ignorebubble";
      button.appendChild(ignorebubble);
      button.addEventListener("click", (e) => 
      {
         //The dropper has a special action when used on colors: it overrides
         //all other operations (except radio select) and toggles the 'ignore'
         //feature on that color (used for drawing 'under' lines)
         if(isDropperActive())
         {
            e.preventDefault();
            e.stopPropagation();
            if(e.currentTarget.hasAttribute("data-ignore"))
               e.currentTarget.removeAttribute("data-ignore");
            else
               e.currentTarget.setAttribute("data-ignore", "");
            setDropperActive(false);
         }
         //They're clicking on it AGAIN. Toggle the hidden state (a literal toggle)
         else if (e.currentTarget.hasAttribute("data-selected"))
         {
            toggleHidden(palettedialog);
         }
         else //Something NEW was clicked, hide the dialog no matter what
         {
            hide(palettedialog);
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
      [...x.children].forEach(y => (y.onclick = () => HTMLUtilities.SimulateRadioSelect(y, x)));
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

function exportSinglePage(page, tracker)
{
   var context = buffer1.getContext("2d");
   CanvasUtilities.Clear(buffer1);
   tracker.drawpointer = 0;
   tracker.scheduledLines = [];
   processLines(tracker, Number.MAX_SAFE_INTEGER, page, Number.MAX_SAFE_INTEGER);
   drawLines(tracker.scheduledLines, context);
   //Need this so images are saved with backgrounds. Can only do it AFTER all
   //drawings, because often times an eraser is used!
   CanvasUtilities.SwapColor(context, new Color(0,0,0,0), new Color(255,255,255,1), 0);
   return buffer1.toDataURL();
}


function setDrawAbility(drawer, canvas, ability)
{
   if(ability)
   {
      drawer.Attach(canvas);
      canvas.setAttribute("data-drawactive", "");
   }
   else
   {
      if(drawer._canvas)
         drawer.Detach();
      else
         console.log("Canvas already detached");
      canvas.removeAttribute("data-drawactive");
   }
}

//This sets up a storage system on the checkbox given, so the state is
//remembered. It can also run functions based on check state
function setupToggleSetting(name, checkbox, checktrue, checkfalse)
{
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
   pagebackward.onclick = () => changePage(-1);
   pageforward.onclick = () => changePage(1);
}

function setupPlaybackControls()
{
   var cmclick = (x) =>
   {
      var size = Number(x.id.replace("canvas", ""));
      //Because of weird ios bugs UGH
      x.setAttribute("data-selected", "");
      CanvasUtilities.SetScaling(drawing, size);
      document.getElementById("window").style.flex = `0 2 ${1000 * size / window.devicePixelRatio}px`;
      scrollbar.refreshScroll();
      setSetting("canvassize", size);
   };

   [...document.querySelectorAll("#canvasmodifier button")].forEach(x =>
   {
      x.addEventListener("click", () => cmclick(x));
   });

   cmclick(document.getElementById("canvas" + getSetting("canvassize")) || size1);
}

//This might be a dumb function idk. Increment is by default the amount to
//change the page, but if 'exact' is set to true, increment will be EXACTLY the
//page to set rather than just the offset.
function changePage(increment, exact)
{
   globals.drawpointer = 0;
   globals.scheduledLines = [];
   setPageNumber(MathUtilities.MinMax((exact ? 0 : getPageNumber()) + increment, 0, 1000000));
   CanvasUtilities.Clear(drawing);
   location.hash = "page" + (getPageNumber() + 1);

   if(getPageNumber() <= 0)
      pagebackward.setAttribute("data-disabled", "");
   else
      pagebackward.removeAttribute("data-disabled");
}

function handlePageHash(hash)
{
   var match = hash.match(/page(\d+)/i);
   if(match)
      changePage(Number(match[1]) - 1, true);
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
         
      post(endpoint(globals.roomname), 
         globals.system.symbols.text + globals.system.CreateMessage(username.value, message.value));
      message.value = "";
      return false;
   });
}

function setupDrawer(canvas)
{
   var drawer = new CanvasPerformer();
   attachBasicDrawerAction(drawer);
   CanvasUtilities.Clear(canvas);
   return drawer;
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
   appendScroll(coverscreencontainer, "Loading, please wait...");

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

   //It will never be higher than 8000 (I think). We do both html AND svg export!
   var svg = HTMLUtilities.CreateSvg(constants.pwidth,constants.pheight); 
   var htmlexport = document.implementation.createHTMLDocument();
   htmlexport.body.innerHTML = `
<meta charset="UTF-8">
<style>
body { width: 1700px; font-family: sans-serif; margin: 8px; padding: 0; }
.pane { display: inline-block; margin: 0 10px; padding: 0; vertical-align: top;}
#textbox { width: 600px; background-color: #FCFCFC; } 
#imagebox > * { display: block; }
#infobox { background: #F7F7F7; padding: 10px; margin-bottom: 15px; }
#infobox h3 { margin-top: 0; }
#imagebox img { image-rendering: moz-crisp-edges; image-rendering: crisp-edges;
   image-rendering: optimizespeed; image-rendering: pixelated; }
.pageid { background: #F3F3F3; padding: 5px; border-radius: 5px; 
   padding-left: 10px; }
.username { font-weight: bold; }
.keyword { color: deeppink; }
.username::after { content: ":"; }
.wholemessage { padding: 1px 3px; }
.striped:nth-child(even) { background-color: #F7F7F7; }
.exported { color: #777; font-size: 0.8em; display: block; margin: 7px 0 3px 0;
   font-style: italic; }
</style>
<script>
function hashtag(e) { e.preventDefault(); }
</script>
<div id="leftpane" class="pane">
   <div id="imagebox"></div>
</div>
<div id="rightpane" class="pane">
   <div id="infobox">
      <h3>${globals.roomname}</h3>
      <time>${globals.preamble.date}</time>
      <time class="exported">Exported: ${(new Date()).toISOString()}</time>
   </div>
   <div id="textbox"></div>
</div>`;

   var textbox = htmlexport.getElementById("textbox");
   var imagebox = htmlexport.getElementById("imagebox");

   //Have to do this repeat parsing in order to reduce memory usage.
   var tracker = { maxPage : 0, chatpointer : 0 };
   var page = 0;
   var ready = true;

   var wait = setInterval(() =>
   {
      if(ready)
      {
         ready = false;

         var pageURI = exportSinglePage(page++, tracker);

         //The html element
         var pageID = document.createElement("a");
         pageID.id = "page_" + page;
         pageID.className = "pageid";
         pageID.innerHTML = "Page " + page;
         pageID.href = "#" + pageID.id;
         imagebox.appendChild(pageID);
         var image = document.createElement("img");
         image.setAttribute('src', pageURI);
         imagebox.appendChild(image);

         //The svg element
         var simage = HTMLUtilities.CreateSvgElement("image");
         simage.setAttribute("x", (page-1) * constants.pwidth);
         simage.setAttribute("y", 0);
         simage.setAttribute("width", constants.pwidth);
         simage.setAttribute("height", constants.pheight);
         simage.setAttributeNS('http://www.w3.org/1999/xlink','href', pageURI);
         svg.appendChild(simage);
         svg.setAttribute("width", constants.pwidth * page);

         appendScroll(coverscreencontainer, `Page ${page}`);
         ready = true;
      }

      if(page > tracker.maxPage)
      {
         clearInterval(wait);

         var msgs = processMessages(tracker, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
         msgs.forEach(x => textbox.appendChild(createMessageElement(x)));

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

      document.body.setAttribute("data-export", "");

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
      //Scripts MUST come AFTER data (since we need to insert it INTO a script)
      [...scripts].forEach(x =>
      {
         $.get(x.src, d =>
         { 
            if(x.src.indexOf("journal.js") >= 0)
            {
               console.log("MATCH: ", x.src);
               var preamble = parsePreamble(data);
               d = d.replace('roomname: ""', 'roomname: ' + JSON.stringify(room))
                  .replace('roomdata: ""', 'roomdata: ' + JSON.stringify(data))
                  .replace('preamble: {}', 'preamble: ' + JSON.stringify(preamble));
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
   var exportCanvas = CanvasUtilities.CreateCopy(drawing, true, 
      Math.min(ld.x1, ld.x2), Math.min(ld.y1, ld.y2), 
      Math.abs(ld.x1 - ld.x2), Math.abs(ld.y1 - ld.y2));
   CanvasUtilities.SwapColor(exportCanvas.getContext("2d"), new Color(0,0,0,0), new Color(255,255,255,1), 0);
   exportCanvas.className = "pixelated";
   return exportCanvas;
}

function exportSection(ld)
{
   var expcanv = copySection(globals.pendingStroke.lines[0])
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

   appendScroll(coverscreencontainer, expcanv);
   appendScroll(coverscreencontainer, explink);
}

function refreshInfo(data)
{
   if(data)
   {
      percenttext.innerHTML = (100 * (data.used / data.limit)).toFixed(2) + "%";
      percentbar.style.width = (75 * data.used / data.limit) + "px";
   }

   version.innerHTML = system.version;
}

function pullInitialStream(continuation)
{
   //Go out and get initial data. If it's empty, we alert to creating the
   //new data, then reload the page (it's just easier). Otherwise, we
   //pull the (maybe huge) initial blob 
   $.getJSON(endpoint(globals.roomname) + "/json?nonblocking=true")
      .done(data =>
      {
         if(data.used == 0)
         {
            if(confirm("This appears to be a brand new journal, are you sure you want to create one here?"))
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
            globals.preamble = parsePreamble(data.data);

            if(!(globals.preamble && globals.preamble.version && globals.preamble.name == system.name &&
               globals.preamble.version.endsWith("f2")))
            {
               showCover({
                  title: "Incompatible format", 
                  text: "This room/journal appears to be in an incorrect format (bad preamble)"
               } );
            }

            handleIncomingData(data);

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
   queryEnd(globals.roomname, globals.roomdata.length, (data, start) =>
   {
      handleIncomingData(data);
      return data.data.length;
   }, () =>
   { 
      setStatus("error");
   }, globals.readonly);
}


function handleIncomingData(data)
{
   globals.roomdata += data.data;
   setStatus("ok");
   refreshInfo(data);
}


//For now, the big function that generates the generic "lines" the journal
//uses. The journal doesn't care about alpha or aliasing or any of that, it
//only draws collections of pixel perfect lines.
function generatePendingLines(drw, pending)
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
      pending.page = getPageNumber();
      pending.erasing = pending.tool.indexOf("erase") >= 0;
      pending.ignoredColors = getIgnoredColors(); //WILL BE an empty list, NOT falsy!
      pending.complex = MiniDraw.GetComplexRectFromIgnore(pending.ignoredColors); //Will be falsy on no complex
      pending.color = pending.erasing ? null : getLineColor();
      pending.lines = [];
   }

   var currentLines = [];

   //There are times when an active stroke will not accept new lines (because
   //it's too long or something, for instance a huge flood fill)
   if(pending.accepting)
   {
      //Simple stroke
      if(pending.tool == "eraser" || pending.tool == "pen")
      {
         pending.type = globals.system.symbols.stroke;
         currentLines.push(new MiniDraw.LineData(pending.size, pending.color,
            Math.round(drw.lastX), Math.round(drw.lastY), 
            Math.round(drw.currentX), Math.round(drw.currentY),
            false, pending.complex));
      }
      //Complex big boy fill
      else if(pending.tool == "fill")
      {
         pending.type = globals.system.symbols.lines;
         pending.size = 1;
         pending.accepting = false; //DON'T do any more fills on this stroke!!
         var context = copyToBackbuffer(drw._canvas);
         globals.system.Flood(context, drw.currentX, drw.currentY, pending.color, currentLines,
            constants.maxLines);
      }
      else if (pending.tool.indexOf("rect") >= 0)
      {
         pending.type = globals.system.symbols.rectangles;
         pending.displayAtEnd = true;

         if(pending.tool == "exportrect")
            pending.postLines = false;

         //If this is the first line, create it. otherwise, keep updating the
         //secondary thing. We don't need "current lines" because a rect fill
         //is literally just one rectangle
         if(!pending.lines.length)
         {
            pending.lines.push(new MiniDraw.LineData(pending.size, pending.color,
               Math.round(Math.max(drw.currentX,0)), Math.round(Math.max(drw.currentY,0)),
               Math.round(Math.max(drw.currentX,0)), Math.round(Math.max(drw.currentY,0)), 
               true, pending.complex));
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

      pending.lines = pending.lines.concat(currentLines);
   }

   return currentLines;
}

function copyToBackbuffer(canvas)
{
   var context = buffer1.getContext("2d");
   CanvasUtilities.CopyInto(context, canvas);
   return context;
}


//Consider moving some of this out of here so the line data portion (the
//"payload" so to speak) can be abstracted away from the idea of pages? but why?
function createLineData(pending)
{
   var startChunk = pending.type + StreamConvert.IntToVariableWidth(pending.page);
   var result = startChunk;

   if(pending.type == globals.system.symbols.stroke)
      result += globals.system.CreateStroke(pending.lines, pending.ignoredColors, 
         globals.system.symbols.cap + startChunk);
   else if(pending.type == globals.system.symbols.lines)
      result += globals.system.CreateBatchLines(pending.lines, pending.ignoredColors);
   else if(pending.type == globals.system.symbols.rectangles)
      result += globals.system.CreateBatchRects(pending.lines, pending.ignoredColors);
   else
      throw "Unknown pending lines type!";

   return result + globals.system.symbols.cap;
}

//Get a collection of lines from the given data. Assume start starts at actual
//line data and not page/type/etc (type is given)
function parseLineData(data, start, length, type)
{
   if(type == globals.system.symbols.stroke)
      return globals.system.ParseStroke(data, start, length);
   else if(type == globals.system.symbols.lines)
      return globals.system.ParseBatchLines(data, start, length);
   else if(type == globals.system.symbols.rectangles)
      return globals.system.ParseBatchRects(data, start, length);
   else
      throw "Unparseable data type " + type;
}

function drawLines(lines, context, overridecolor) 
{ 
   context = context || globals.context;
   lines.forEach(x => 
   {
      if(overridecolor)
         x.color = overridecolor;
      MiniDraw.SimpleRectLine(context, x);
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

function frameFunction()
{
   if(globals.scheduledScrolls.length > 0)
   {
      globals.scheduledScrolls.forEach(x => x.scrollTop = x.scrollHeight);
      globals.scheduledScrolls = [];
   }

   //First, perform self-lines
   if(globals.drawer)
   {
      drawLocal(globals.drawer, globals.pendingStroke);

      if(globals.drawer.currentlyDrawing)
      {
         if(getTool().indexOf("rect") >= 0)
         {
            selectRect(globals.drawer.startAction.clientX, globals.drawer.startAction.clientY,
               globals.drawer.currentAction.clientX, globals.drawer.currentAction.clientY);
         }
      }
      //Post lines when we're done (why is this in the frame drawer again?)
      else 
      {
         //Hopefully this doesn't become a performance concern
         clearSelectRect();

         //Don't need to continuously look at the pending stroke when there is none
         if(globals.pendingStroke.active)
         {
            if(globals.pendingStroke.tool == "exportrect")
               exportSection(globals.pendingStroke.lines[0]);

            //This saves us in a few ways: some tools don't actually generate lines!
            if(globals.pendingStroke.lines.length > 0 && globals.pendingStroke.postLines)
            {
               var ldata = createLineData(globals.pendingStroke);
               post(endpoint(globals.roomname), ldata, () => setStatus("ok"), () => setStatus("error"));
               //console.log("POSTED: ", ldata);
               if(globals.pendingStroke.displayAtEnd)
                  drawLines(globals.pendingStroke.lines);
               //console.log("Stroke complete: " + ldata);
               //drawLines(parseLineData(ldata, 2, ldata.length - 3, ldata.charAt(0)), "#FF0000");
            }
            globals.pendingStroke.active = false;
         }
      }
   }

   var msgs = processMessages(globals, constants.maxMessageRender);
   
   if(msgs.length > 0)
   {
      var fragment = new DocumentFragment();
      msgs.forEach(x => fragment.appendChild(createMessageElement(x)));
      messages.appendChild(fragment);
      globals.scheduledScrolls.push(messagecontainer);
   }

   //The incoming draw data handler
   var pbspeed = getPlaybackSpeed();
   processLines(globals, pbspeed, getPageNumber());

   //Now draw lines based on playback speed (if there are any)
   if(globals.scheduledLines.length > 0)
      drawLines(globals.scheduledLines.splice(0, pbspeed));

   requestAnimationFrame(frameFunction);
}

function drawLocal(drawer, pending)
{
   if(drawer.currentX !== null)
   {
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
         drawLines(generatePendingLines(drawer, pending));

         //These are NOT performed every frame because the drawing events are
         //NOT synchronized to the frame, so we could be removing that very
         //important "lastX lastY" data
         drawer.lastX = drawer.currentX;
         drawer.lastY = drawer.currentY;
         drawer.currentX = null;
         drawer.currentY = null;
      }
   }
}

function doDropper(x, y)
{
   var ctx = copyToBackbuffer(globals.drawer._canvas);
   var color = CanvasUtilities.GetColor(ctx, x, y);
   console.log("Dropper: ", color);

   //Don't activate the dropper on non-colors
   if(color.a)
   {
      setLineColor(color.ToHexString());
      setDropperActive(false);
   }
}

function dataScan(start, func, maxScan)
{
   //always skip preamble
   if(start < globals.preamble.skip)
      start = globals.preamble.skip;

   maxScan = maxScan || constants.maxScan;

   globals.system.DataScan(globals.roomdata, start, func, maxScan);
}

//The message handler
function processMessages(tracker, max, scanLimit)
{
   var messages = []; 

   dataScan(tracker.chatpointer, (start, length, cc, end) =>
   {
      tracker.chatpointer = end; //start + length;

      if(cc != globals.system.symbols.text)
         return;

      messages.push(globals.system.ParseMessage(globals.roomdata, start, length));
         //start + constants.messageHeaderLength, length - constants.messageHeaderLength)));

      return messages.length > max;
   }, scanLimit);

   return messages;
}

function processLines(tracker, limit, page, scanLimit)
{
   dataScan(tracker.drawpointer, (start, length, cc, end) =>
   {
      tracker.drawpointer = end; //start + length;

      //We only handle certain things in draw
      if(cc != globals.system.symbols.lines && 
         cc != globals.system.symbols.stroke && 
         cc != globals.system.symbols.rectangles)
         return;

      //We ALSO only handle the draw if it's the right PAGE.
      var pageDat = StreamConvert.VariableWidthToInt(globals.roomdata, start);

      if(pageDat.value > tracker.maxPage)
         tracker.maxPage = pageDat.value;

      if(pageDat.value != page)
         return;

      //Parse the lines, draw them, and update the line count all in one
      //(drawLines returns the lines again). The minus one in length is the
      //ending cap (needs to be removed in DataScan)
      tracker.scheduledLines = tracker.scheduledLines.concat(
         parseLineData(globals.roomdata, start + pageDat.length, length - pageDat.length - 1, cc));

      return tracker.scheduledLines.length > limit;
   }, scanLimit);
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

