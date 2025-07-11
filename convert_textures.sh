#!/bin/bash
# This script converts all .tga files in a specified directory to .webp format
# by first converting them to temporary PNG files.

# The directory containing the original .tga textures.
SOURCE_DIR="GLBandFBX_010725"

# The quality setting for the WebP conversion (1-100). 75 is a good balance.
QUALITY=50

# Ensure the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory '$SOURCE_DIR' not found."
  exit 1
fi

# Find all .tga files and convert them
for tga_file in "$SOURCE_DIR"/*.tga; do
  if [ -f "$tga_file" ]; then
    # Get the filename without the extension
    base_name=$(basename "$tga_file" .tga)
    # Define the temporary .png file path
    png_file="$SOURCE_DIR/$base_name.png"
    # Define the final .webp file path
    webp_file="$SOURCE_DIR/$base_name.webp"
    
    echo "Converting '$tga_file' to temporary PNG..."
    # Use ImageMagick to convert TGA to PNG
    magick convert "$tga_file" "$png_file"
    
    if [ -f "$png_file" ]; then
      echo "Converting temporary PNG to '$webp_file'..."
      # Run the cwebp converter on the PNG
      cwebp -q $QUALITY "$png_file" -o "$webp_file"
      
      # Remove the temporary PNG file
      rm "$png_file"
    else
      echo "Error: Failed to create temporary PNG for '$tga_file'."
    fi
  fi
done

echo "Texture conversion complete." 