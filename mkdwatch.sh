#!/bin/bash

# temp name is just time, whatever
BASE=$1
REDIR=`date +%s`
WBASE="dwatch"
FLD="$WBASE/$REDIR"

if [ "$#" -ne "1" ]
then
   echo "You must provide the origin room name!"
   exit 1
fi

mkdir "$FLD"
cp *.js "$WBASE"
cp -r "draw/." "$FLD"
cd "$FLD"

echo "/*what even is this file? i'm sorry*/\$(document).ready(function()\
   { document.getElementById('palette').style.display='none';\
     line.style.display='none';newroom.style.display='none';\
     swapside.style.display='none';window.export.style.display='none';\
     drawing.style.cursor='unset';
   });var cbdoof=createBaseDrawer;createBaseDrawer=function(a,b,c,d,e,f)\
   { var d=cbdoof(a,b,c,d,e,f);d.OnAction=false;return d;};\
   system.fileName=function(){return (Math.floor(new Date().getTime()/1000));};\
   system.room='$BASE';" >> "main.js"

echo "Your drawer is at: $FLD"
