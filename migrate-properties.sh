#!/bin/bash

# Script to migrate property names from Firebase to PocketBase

echo "Starting Firebase to PocketBase property migration..."

# Find all TypeScript and TSX files
find . -name "*.ts" -o -name "*.tsx" | while read -r file; do
    echo "Processing: $file"
    
    # Skip node_modules and other directories
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".git"* ]]; then
        continue
    fi
    
    # Replace Firebase properties with PocketBase equivalents
    sed -i.bak \
        -e 's/\.uid/\.id/g' \
        -e 's/\.photoURL/\.avatar/g' \
        -e 's/\.creator/\.user/g' \
        -e 's/\.message/\.content/g' \
        -e 's/\.members/\.participants/g' \
        -e 's/\.lastMessage/\.lastContent/g' \
        -e 's/\.lastUpdate/\.lastActivity/g' \
        -e 's/\.seconds/getTime()/g' \
        "$file"
        
    # Remove .bak files
    rm -f "${file}.bak"
done

echo "Property migration completed!"
