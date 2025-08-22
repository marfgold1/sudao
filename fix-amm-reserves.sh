#!/bin/bash

echo "🔧 Fixing AMM reserves mismatch..."

# Get canister IDs
AMM_CANISTER_ID=$(dfx canister id sudao_amm)
ICP_CANISTER_ID=$(dfx canister id icp_ledger_canister)
GOVERNANCE_CANISTER_ID=$(dfx canister id sudao_ledger)
OWNER_PRINCIPAL=$(dfx identity get-principal)

echo "AMM Canister: $AMM_CANISTER_ID"
echo "ICP Canister: $ICP_CANISTER_ID"
echo "Governance Canister: $GOVERNANCE_CANISTER_ID"
echo "Owner: $OWNER_PRINCIPAL"

echo ""
echo "📊 Current AMM state:"
dfx canister call sudao_amm get_reserves
dfx canister call sudao_amm get_token_info

echo ""
echo "💰 Actual AMM balances:"
echo "ICP balance:"
dfx canister call icp_ledger_canister icrc1_balance_of "(record { owner = principal \"$AMM_CANISTER_ID\"; subaccount = null })"
echo "Governance balance:"
dfx canister call sudao_ledger icrc1_balance_of "(record { owner = principal \"$AMM_CANISTER_ID\"; subaccount = null })"

echo ""
echo "🔄 Resetting AMM state..."
dfx canister call sudao_amm reset_state

echo ""
echo "🏗️ Reinitializing AMM..."
dfx canister call sudao_amm initialize "(principal \"$ICP_CANISTER_ID\", principal \"$GOVERNANCE_CANISTER_ID\", principal \"$OWNER_PRINCIPAL\")"

echo ""
echo "💧 Adding initial liquidity (1,000,000 ICP + 1,000,000 Governance)..."
dfx canister call sudao_amm add_liquidity "(record { amount0_desired = 1_000_000 : nat; amount0_min = null; amount1_desired = 1_000_000 : nat; amount1_min = null })"

echo ""
echo "✅ AMM should now be fixed! Check the new state:"
dfx canister call sudao_amm get_reserves
dfx canister call sudao_amm get_token_info

echo ""
echo "🧪 Test a swap quote:"
dfx canister call sudao_amm get_swap_quote "(principal \"$ICP_CANISTER_ID\", 10_000 : nat)" 