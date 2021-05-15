#!/bin/bash

output=output
rm -f $output

for f in *.hex
do
   fname="${f%.*}"
   echo -n "   \"$fname\" : [" >> $output
   awk '{printf "\"#%s\",",$1 }' $f | sed $'s/\r//g' >> $output
   echo "]," >> $output
done

sed -i 's/,]/]/g' $output
