# Script to convert SVG to PNG for Mini App images
# Run this after deployment or use an online converter

# Required images:
# - icon.png (512x512)
# - splash.png (1200x630)
# - hero.png (1200x630)
# - og.png (1200x630)
# - embed-image.png (1200x630)
# - screenshot-sender.png (1200x630)
# - screenshot-receiver.png (1200x630)

# You can use services like:
# - https://cloudconvert.com/svg-to-png
# - https://svgtopng.com/
# - Or install imagemagick: brew install imagemagick
#   then run: for f in public/*.svg; do convert "$f" "${f%.svg}.png"; done
