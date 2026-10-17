#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Copying P1 Roadmap and Schedule files into frontend..."
cp -R "$SCRIPT_DIR/frontend/src/features/roadmap/"* "$ROOT_DIR/frontend/src/features/roadmap/"
cp -R "$SCRIPT_DIR/frontend/src/components/"* "$ROOT_DIR/frontend/src/components/"

echo "Files copied successfully into frontend!"
