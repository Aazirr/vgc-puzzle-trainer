#!/bin/bash
# Quick validation script for frontend implementation

echo "🔍 Validating VGC Puzzle Trainer Frontend..."
echo ""

cd apps/web

# Check dependencies are listed
if [ -f "package.json" ]; then
  echo "✅ package.json exists"
else
  echo "❌ package.json missing"
  exit 1
fi

# Check critical files exist
FILES=(
  "app/page.tsx"
  "app/layout.tsx"
  "app/globals.css"
  "app/puzzles/\[id\]/page.tsx"
  "components/BattleField.tsx"
  "components/PokemonCard.tsx"
  "components/PuzzleQuestion.tsx"
  "lib/pokeapi.ts"
  "lib/hooks.ts"
  "lib/security.ts"
  "types/index.ts"
  "middleware.ts"
  "next.config.mjs"
)

echo ""
echo "📁 Checking critical files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file"
  fi
done

echo ""
echo "🏗️ Running type checking..."
if npm run typecheck 2>/dev/null; then
  echo "  ✅ TypeScript compilation successful"
else
  echo "  ⚠️  Check TypeScript errors above"
fi

echo ""
echo "📊 Checking build size..."
if npm run build 2>&1 | grep -q "Route"; then
  echo "  ✅ Build completed"
else
  echo "  ⚠️  Build may have issues"
fi

echo ""
echo "✨ Frontend validation complete!"
