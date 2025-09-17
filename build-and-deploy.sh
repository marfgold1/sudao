#!/bin/bash

# Build and Deploy Script for DAO Explorer
# This script demonstrates the complete workflow for deploying the DAO explorer system

set -e  # Exit on any error

echo "🚀 Starting DAO Explorer build and deployment process..."

if [ -z "$1" ]; then
    NETWORK="local"
else
    NETWORK=$1
fi

# Step 1: Start local replica if not running (only if network not ic)
if [ "$NETWORK" == "local" ]; then
    echo "Running on local network, checking local replica status..."
    if ! dfx ping > /dev/null 2>&1; then
        echo "❌ Local replica is not running, starting local replica..."
        dfx start --background --clean
    else
        echo "✅ Local replica is already running"
    fi
else
    echo "Running on network: $NETWORK"
fi

# Step 2: Deploy the DAO Explorer canister
echo "🏗️  Deploying DAO Explorer canister"
dfx deploy sudao_be_explorer --network=$NETWORK
if [ "$NETWORK" == "local" ]; then
    # Only needed for local network
    echo "Deploying ICP ledger canister in local network..."
    dfx deploy icp_ledger_canister --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai
    echo "Adding cycles to DAO Explorer canister in local network..."
    dfx ledger fabricate-cycles --t 10 --canister sudao_be_explorer || true # silently ignore the error
fi

# Get the explorer canister ID
EXPLORER_ID=$(dfx canister id sudao_be_explorer --network=$NETWORK)
echo "✅ DAO Explorer deployed with ID: $EXPLORER_ID"

# Step 3 & 4: Modular build and upload for each wasm code
# Note that we can just use local network to build wasm
build_and_upload_wasm() {
    local CODE_TYPE=$1
    local CANISTER_NAME=$2

    # Build
    echo "🔧 Building $CANISTER_NAME WASM..."
    dfx build $CANISTER_NAME

    # Path
    local WASM_PATH=".dfx/local/canisters/${CANISTER_NAME}/${CANISTER_NAME}.wasm"
    local WASM_GZ_PATH="${WASM_PATH}.gz"

    if [ -f "$WASM_PATH" ]; then
        # .wasm exists, use as is
        :
    elif [ -f "$WASM_GZ_PATH" ]; then
        echo "🗜️  Found gzipped WASM at $WASM_GZ_PATH, extracting..."
        gunzip -c "$WASM_GZ_PATH" > "$WASM_PATH"
        if [ $? -ne 0 ] || [ ! -f "$WASM_PATH" ]; then
            echo "❌ Error: Failed to extract $WASM_GZ_PATH"
            exit 1
        fi
    else
        echo "❌ Error: $CANISTER_NAME WASM file not found at $WASM_PATH or $WASM_GZ_PATH"
        exit 1
    fi
    echo "✅ $CANISTER_NAME WASM built at: $WASM_PATH"

    # Upload
    echo "📦 Uploading $CANISTER_NAME WASM code to DAO Explorer in $NETWORK network as code type '$CODE_TYPE'..."
    local WASM_HEX=$(hexdump -ve '"\\" 1/1 "%02X"' "$WASM_PATH")
    local VERSION=$(date +"%Y%m%d-%H%M%S")
    # Read WASM file as raw blob
    dfx canister call sudao_be_explorer setWasmCode --network=$NETWORK --argument-file \
        <(echo "(variant { $CODE_TYPE }, blob \"$WASM_HEX\", \"$VERSION\")")
}

# Build and upload both backend and ledger
modules=(
    "backend:sudao_backend"
    "ledger:sudao_ledger"
    "swap:sudao_amm"
)

# Build and upload all WASM modules in parallel, then wait for completion
pids=()
for entry in "${modules[@]}"; do
    IFS=":" read -r code_type canister <<< "$entry"
    # need to create canister first because it's not concurrent safe
    dfx canister create $canister
    build_and_upload_wasm "$code_type" "$canister" &
    pids+=($!)
done
for pid in "${pids[@]}"; do
    wait "$pid"
    if [ $? -ne 0 ]; then
        echo "❌ Error: One of the build_and_upload_wasm jobs failed."
        exit 1
    fi
done

echo "✅ All WASM code uploaded successfully!"

# Step 5: Verify the upload
echo "🔍 Verifying WASM upload..."
HAS_WASM=$(dfx canister call sudao_be_explorer isDeploymentReady --network=$NETWORK)

if [[ "$HAS_WASM" == *"ok"* ]]; then
    echo "✅ WASM code verification successful!"
else
    echo "❌ WASM code verification failed!"
    exit 1
fi

# Step 6: Display system info
echo "📊 System Information:"
dfx canister call sudao_be_explorer getSystemInfo --network=$NETWORK

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🔧 Usage Examples:"
echo "# List all DAOs:"
echo "dfx canister call sudao_be_explorer listDAOs --network=$NETWORK"
