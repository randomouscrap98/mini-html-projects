//Yeah
$(document).ready(function()
{
   console.log("I'M READY");
   var drawer = new CanvasDrawer();
   var drawing = $("#drawing");
   var canvas = drawing[0];
   drawer.Attach(canvas, []);
});
