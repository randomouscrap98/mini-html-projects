#!/bin/bash

# Set the directory to process
directory="stamps/irasutoya"

# Loop over each file in the directory
for file in "$directory"/*
do
  # Check if the file is a regular file
  if [ -f "$file" ]
  then
    # Generate the HTML output
    echo "<div class=\"stamp\">"
    echo "   <img src=\"$directory/$(basename "$file")\" data-width=\"200\">"
    echo "</div>"
  fi
done
