#!/usr/bin/env bash
# Cross-platform build launcher for AegisMesh Sovereign.
# Mimics hello-pear-qvac-tui make script.
set -euo pipefail

TARGET="${1:-linux-x64}"
OUT_DIR="out"

echo "=== AegisMesh Sovereign — Build for $TARGET ==="

mkdir -p "$OUT_DIR/$TARGET"

# Determine binary name
case "$TARGET" in
  linux-x64)    BIN="aegismesh-linux-x64" ;;
  linux-arm64)  BIN="aegismesh-linux-arm64" ;;
  darwin-arm64) BIN="aegismesh-darwin-arm64" ;;
  darwin-x64)   BIN="aegismesh-darwin-x64" ;;
  win32-x64)    BIN="aegismesh-win32-x64.exe" ;;
  *) echo "Unknown target: $TARGET"; exit 1 ;;
esac

# Copy assets and bundle
echo "[1/4] Installing dependencies..."
npm install --omit=dev 2>/dev/null || npm install

echo "[2/4] Copying runtime files..."
cp -r ui "$OUT_DIR/$TARGET/" 2>/dev/null || true
cp -r workers "$OUT_DIR/$TARGET/" 2>/dev/null || true
cp package.json "$OUT_DIR/$TARGET/" 2>/dev/null || true

echo "[3/4] Creating binary wrapper..."
cat > "$OUT_DIR/$TARGET/$BIN" << 'WRAPPER'
#!/usr/bin/env node
import('./workers/boot.mjs').catch(e => { console.error(e); process.exit(1); });
WRAPPER
chmod +x "$OUT_DIR/$TARGET/$BIN"

echo "[4/4] Packaging..."
cd "$OUT_DIR/$TARGET"
tar -czf "../aegismesh-$TARGET.tar.gz" .
cd "$OLDPWD"

echo "=== Build complete: out/aegismesh-$TARGET.tar.gz ==="
echo "=== To release: pear build --package=./package.json --$TARGET-app ./out/$TARGET/aegismesh --target ../release ==="
