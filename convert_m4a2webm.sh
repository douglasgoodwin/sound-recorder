#!/bin/bash

for FILE in *.qt ; do
    OUTNAME=`basename "$FILE"`.webm
    ffmpeg -i $FILE -c:v libvpx -b:v 1M -c:a libvorbis $OUTNAME
done