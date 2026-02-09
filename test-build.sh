#!/bin/bash
echo "Testing if TailwindCSS is working..."
echo ""
echo "Checking generated CSS file..."
if grep -q "bg-gradient-to-br" dist/assets/*.css 2>/dev/null; then
    echo "✅ TailwindCSS gradients found in CSS!"
else
    echo "❌ No Tailwind classes found"
fi

if grep -q "from-blue" dist/assets/*.css 2>/dev/null; then
    echo "✅ Color utilities found!"
else
    echo "❌ No color utilities found"
fi

echo ""
echo "CSS file size:"
ls -lh dist/assets/*.css 2>/dev/null | awk '{print $5, $9}'
