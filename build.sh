#!/bin/bash
set -e

echo "Building DBAdmin Module Plugin..."

case "$(uname -s)" in
    Linux*)     EXT=".so";;
    Darwin*)    EXT=".dylib";;
    MINGW*|MSYS*|CYGWIN*) EXT=".dll";;
    *)          EXT=".so";;
esac

cd handlers
go build -buildmode=plugin -o ../dbadmin${EXT} plugin.go dbadmin_handler_simple.go types.go
echo "✓ Plugin built successfully: dbadmin${EXT}"

