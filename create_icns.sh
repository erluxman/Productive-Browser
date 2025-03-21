#!/bin/bash

# Create iconset directory
mkdir -p build/icon.iconset

# Convert SVG to PNG at different sizes
for size in 16 32 64 128 256 512; do
  # Normal resolution
  convert -background none -resize ${size}x${size} build/icon.svg build/icon.iconset/icon_${size}x${size}.png
  # High resolution (2x)
  convert -background none -resize $((size*2))x$((size*2)) build/icon.svg build/icon.iconset/icon_${size}x${size}@2x.png
done

# Create icns file
iconutil -c icns build/icon.iconset

# Clean up
rm -rf build/icon.iconset 