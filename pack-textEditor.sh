#!/bin/bash
set -euxo pipefail

cd "$(dirname "$0")"

BUILD_DIR="build"
CUSTOM_DIR="custom"
IMG_DIR="img"
OUT_FILE="textEditor.7z"
REPO_ROOT="$(pwd)"
OUT_PATH="$REPO_ROOT/$OUT_FILE"
PACKAGE_ROOT_NAME="texteditor"

node ./Makefile.dryice.js -m --target "$BUILD_DIR"

SRC_MIN_DIR="$BUILD_DIR/src-min"
if [[ ! -d "$SRC_MIN_DIR" ]]; then
    echo "build output not found: $SRC_MIN_DIR" >&2
    exit 1
fi

if [[ ! -d "$CUSTOM_DIR" ]]; then
    echo "custom directory not found: $CUSTOM_DIR" >&2
    exit 1
fi

if [[ ! -d "$IMG_DIR" ]]; then
    echo "img directory not found: $IMG_DIR" >&2
    exit 1
fi

rm -f "$OUT_PATH"

STAGING_DIR="$(mktemp -d -t ace-textEditor-XXXXXX)"
cleanup() {
    rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

PACKAGE_DIR="$STAGING_DIR/$PACKAGE_ROOT_NAME"
mkdir -p "$PACKAGE_DIR"

rsync -a \
    --exclude="__MACOSX" \
    --exclude=".DS_Store" \
    --exclude="*.md" \
    --exclude="._*" \
    --exclude=".AppleDouble" \
    --exclude=".Spotlight-V100" \
    --exclude=".Trashes" \
    --exclude=".fseventsd" \
    --exclude=".TemporaryItems" \
    "$CUSTOM_DIR/" "$PACKAGE_DIR/"

rsync -a \
    --exclude="__MACOSX" \
    --exclude=".DS_Store" \
    --exclude="._*" \
    --exclude=".AppleDouble" \
    --exclude=".Spotlight-V100" \
    --exclude=".Trashes" \
    --exclude=".fseventsd" \
    --exclude=".TemporaryItems" \
    "$SRC_MIN_DIR" "$PACKAGE_DIR/"

rsync -a \
    --exclude="__MACOSX" \
    --exclude=".DS_Store" \
    --exclude="._*" \
    --exclude=".AppleDouble" \
    --exclude=".Spotlight-V100" \
    --exclude=".Trashes" \
    --exclude=".fseventsd" \
    --exclude=".TemporaryItems" \
    "$IMG_DIR" "$PACKAGE_DIR/"

(
    cd "$STAGING_DIR"
    7z a -t7z -mx=9 -y \
        -xr\!__MACOSX \
        -xr\!.DS_Store \
        -xr\!._\* \
        -xr\!.AppleDouble \
        -xr\!.Spotlight-V100 \
        -xr\!.Trashes \
        -xr\!.fseventsd \
        -xr\!.TemporaryItems \
        "$OUT_PATH" "$PACKAGE_ROOT_NAME"
)

echo "$OUT_PATH"
