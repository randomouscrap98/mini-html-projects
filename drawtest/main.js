//Yeah
$(document).ready(function()
{
   var st = StyleUtilities.CreateStyleElement();
   StyleUtilities.InsertStylesAtTop([st]);
   st.Append(["canvas"], StyleUtilities.NoImageInterpolationRules());

   console.log("I'M READY");

   var drawing = $("#drawing");

   var drawer = new CanvasDrawer();
   var nTool = new CanvasDrawerTool(networkTool);
   nTool.frameLock = 1;
   nTool.stationaryReportInterval = 1;
   drawer.tools["network"] = nTool;
   drawer.currentTool = "network";
   drawer.lineWidth = 3;

   var canvas = drawing[0];
   canvas.width = 600;
   canvas.height = 600;

   drawer.Attach(canvas, [], 0);
});

function networkTool(data, context, drawer)
{
   return data.lineFunction(context, data.oldX, data.oldY, data.x, data.y, data.lineWidth);
}
