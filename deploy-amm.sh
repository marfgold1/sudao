#!/bin/bash

# Deploy and initialize AMM canister
echo "🚀 Deploying AMM canister..."

# Deploy the AMM canister
dfx deploy sudao_amm

# Get the canister IDs
AMM_CANISTER_ID=$(dfx canister id sudao_amm)
ICP_CANISTER_ID=$(dfx canister id icp_ledger_canister)
GOVERNANCE_CANISTER_ID=$(dfx canister id sudao_ledger)

echo "📋 Canister IDs:"
echo "  AMM: $AMM_CANISTER_ID"
echo "  Local ICP: $ICP_CANISTER_ID"
echo "  Governance Token: $GOVERNANCE_CANISTER_ID"

# Get the default identity
DEFAULT_IDENTITY=$(dfx identity whoami)
echo "👤 Using identity: $DEFAULT_IDENTITY"

# Get the principal of the default identity
PRINCIPAL=$(dfx identity get-principal)
echo "🔑 Principal: $PRINCIPAL"

echo "🔧 Initializing AMM..."

# Initialize the AMM with the token canisters
dfx canister call sudao_amm initialize "(
  principal \"$ICP_CANISTER_ID\",
  principal \"$GOVERNANCE_CANISTER_ID\",
  principal \"$PRINCIPAL\"
)"

echo "✅ AMM initialization complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Add liquidity to the AMM using the add_liquidity function"
echo "2. Test the swap functionality in the frontend"
echo ""
echo "📊 To check AMM status:"
echo "  dfx canister call sudao_amm get_token_info"
echo ""
echo "💰 To add liquidity:"
echo "  dfx canister call sudao_amm add_liquidity '(record { amount0_desired = 1000000; amount1_desired = 1000000; amount0_min = null; amount1_min = null })'" 