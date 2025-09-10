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

# Step 2: Deploy the DAO Explorer canister and add cycles
echo "🏗️  Deploying DAO Explorer canister and adding cycles..."
dfx deploy sudao_be_explorer
dfx deploy icp_ledger_canister --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai
# silently ignore the error
dfx ledger fabricate-cycles --t 100 --canister sudao_be_explorer || true

# Get the explorer canister ID
EXPLORER_ID=$(dfx canister id sudao_be_explorer)
echo "✅ DAO Explorer deployed with ID: $EXPLORER_ID"


# Build and upload both backend and ledger
modules=(
    "backend:sudao_backend"
    "ledger:sudao_ledger"
    "swap:sudao_amm"
)

# Build all WASM modules first (in parallel), then upload sequentially
echo "🔧 Building all WASM modules in parallel..."
pids=()
for entry in "${modules[@]}"; do
    IFS=":" read -r code_type canister <<< "$entry"
    # need to create canister first because it's not concurrent safe
    dfx canister create $canister
    (
        echo "🔧 Building $canister WASM..."
        dfx build $canister
        
        # Path
        WASM_PATH=".dfx/local/canisters/${canister}/${canister}.wasm"
        WASM_GZ_PATH="${WASM_PATH}.gz"

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
            echo "❌ Error: $canister WASM file not found at $WASM_PATH or $WASM_GZ_PATH"
            exit 1
        fi
        echo "✅ $canister WASM built at: $WASM_PATH"
    ) &
    pids+=($!)
done

# Wait for all builds to complete
for pid in "${pids[@]}"; do
    wait "$pid"
    if [ $? -ne 0 ]; then
        echo "❌ Error: One of the build jobs failed."
        exit 1
    fi
done

echo "🔧 All WASM modules built. Starting sequential upload..."

# Now upload sequentially to avoid race conditions
for entry in "${modules[@]}"; do
    IFS=":" read -r code_type canister <<< "$entry"
    
    WASM_PATH=".dfx/local/canisters/${canister}/${canister}.wasm"
    VERSION=$(date +"%Y%m%d-%H%M%S")
    FILE_SIZE=$(stat -c%s "$WASM_PATH")
    
    echo "📦 Uploading $canister WASM code to DAO Explorer as code type '$code_type'..."
    
    # Check if file is larger than 800KB (use chunked upload)
    if [ "$FILE_SIZE" -gt 819200 ]; then
        echo "Large file detected ($FILE_SIZE bytes), using chunked upload..."
        CHUNK_SIZE=524288  # 512KB chunks to account for hex encoding (2x) + candid overhead
        TOTAL_CHUNKS=$(( ($FILE_SIZE + $CHUNK_SIZE - 1) / $CHUNK_SIZE ))
        
        echo "Uploading in $TOTAL_CHUNKS chunks..."
        for i in $(seq 0 $((TOTAL_CHUNKS - 1))); do
            OFFSET=$(( $i * $CHUNK_SIZE ))
            CHUNK_FILE=$(mktemp)
            
            # Extract chunk from WASM file
            dd if="$WASM_PATH" of="$CHUNK_FILE" bs=1 skip=$OFFSET count=$CHUNK_SIZE 2>/dev/null
            
            # Convert chunk to hex
            CHUNK_HEX=$(hexdump -ve '1/1 "%02x"' "$CHUNK_FILE" 2>/dev/null || xxd -p -c 256 "$CHUNK_FILE" | tr -d '\n')
            TEMP_ARG_FILE=$(mktemp)
            echo "(variant { $code_type }, blob \"$CHUNK_HEX\", $i, $TOTAL_CHUNKS, \"$VERSION\")" > "$TEMP_ARG_FILE"
            
            echo "Uploading chunk $((i + 1))/$TOTAL_CHUNKS..."
            dfx canister call sudao_be_explorer uploadWasmChunk --argument-file "$TEMP_ARG_FILE"
            
            rm "$CHUNK_FILE" "$TEMP_ARG_FILE"
        done
    else
        # Small file, use single upload  
        echo "⚠️  Debugging WASM upload format..."
        
        # Try the original quoted hex format but ensure proper WASM hex encoding
        echo "🔧 Converting WASM to hex blob format..."
        WASM_HEX=$(hexdump -ve '1/1 "%02x"' "$WASM_PATH" 2>/dev/null || xxd -p -c 256 "$WASM_PATH" | tr -d '\n')
        TEMP_ARG_FILE=$(mktemp)
        
        # Use blob with quoted hex - this is the standard Candid format
        echo "(variant { $code_type }, blob \"$WASM_HEX\", \"$VERSION\")" > "$TEMP_ARG_FILE"
        
        echo "Attempting upload with hex blob format..."
        dfx canister call sudao_be_explorer setWasmCode --argument-file "$TEMP_ARG_FILE"
        rm "$TEMP_ARG_FILE"
    fi
done

echo "✅ All WASM code uploaded successfully!"

# Step 5: Verify the upload
echo "🔍 Verifying WASM upload..."
HAS_WASM=$(dfx canister call sudao_be_explorer isDeploymentReady)

if [[ "$HAS_WASM" == *"ok"* ]]; then
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
