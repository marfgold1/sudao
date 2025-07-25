#!/bin/bash

# Build and Deploy Script for DAO Explorer
# This script demonstrates the complete workflow for deploying the DAO explorer system

set -e  # Exit on any error

echo "🚀 Starting DAO Explorer build and deployment process..."

# Step 1: Start local replica if not running
echo "📡 Checking local replica status..."
if ! dfx ping > /dev/null 2>&1; then
    echo "Starting local replica..."
    dfx start --background --clean
else
    echo "Local replica is already running"
fi

# Step 2: Deploy the DAO Explorer canister
echo "🏗️  Deploying DAO Explorer canister..."
dfx deploy sudao_be_explorer

# Get the explorer canister ID
EXPLORER_ID=$(dfx canister id sudao_be_explorer)
echo "✅ DAO Explorer deployed with ID: $EXPLORER_ID"
dfx cycles top-up $EXPLORER_ID 100T

# Step 3: Build the sudao_backend WASM
echo "🔧 Building sudao_backend WASM..."
dfx canister create sudao_backend
dfx build sudao_backend

# Get the WASM file path
WASM_PATH=".dfx/local/canisters/sudao_backend/sudao_backend.wasm"
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ Error: WASM file not found at $WASM_PATH"
    exit 1
fi

echo "✅ sudao_backend WASM built at: $WASM_PATH"

# Step 4: Upload WASM to the explorer
echo "📦 Uploading WASM code to DAO Explorer..."

# Read WASM file and convert to hex for dfx call
WASM_HEX=$(hexdump -ve '1/1 "\\%02X"' "$WASM_PATH")
VERSION=$(date +"%Y%m%d-%H%M%S")

# Call the setWasmCode function
echo "Uploading WASM (version: $VERSION)..."
dfx canister call sudao_be_explorer setWasmCode --argument-file <(echo "(blob \"$WASM_HEX\", \"$VERSION\")")

echo "✅ WASM code uploaded successfully!"

# Step 5: Verify the upload
echo "🔍 Verifying WASM upload..."
HAS_WASM=$(dfx canister call sudao_be_explorer hasWasmCode | grep -o 'true\|false')

if [ "$HAS_WASM" = "true" ]; then
    echo "✅ WASM code verification successful!"
else
    echo "❌ WASM code verification failed!"
    exit 1
fi

# Step 6: Display system info
echo "📊 System Information:"
dfx canister call sudao_be_explorer getSystemInfo

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🔧 Usage Examples:"
echo "# List all DAOs:"
echo "dfx canister call sudao_be_explorer listDAOs"
