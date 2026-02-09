#!/bin/bash

echo "=== Paparazzi Compare - Debugging Guide ==="
echo ""
echo "If you see 'Failed to load image' error:"
echo ""
echo "1. Open DevTools (Right-click > Inspect or F12)"
echo "2. Check the Console tab for errors"
echo "3. Look for messages starting with 'Loading image from:' and 'Converted file src:'"
echo ""
echo "Common issues:"
echo "  - Asset protocol not enabled"
echo "  - File path permissions"
echo "  - File doesn't exist at the path"
echo ""
echo "The app now has console.log statements to help debug."
echo ""
echo "Starting app..."
echo ""

npm run tauri dev
