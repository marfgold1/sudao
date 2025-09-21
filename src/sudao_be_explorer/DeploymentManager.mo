import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import List "mo:base/List";
import Nat64 "mo:base/Nat64";
import Map "mo:map/Map";
import { thash; n8hash } "mo:map/Map";

import Types "Types";
import CommonTypes "../common/Types";
import { ic } "mo:ic";
import AMMTypes "../sudao_amm/Types";

module {
  public type DeployingStep = {
    #creating_canister : Types.WasmCodeType;
    #installing_code : Types.WasmCodeType;
  };

  public type DeployingInfo = {
    step : DeployingStep;
    startedAt : Time.Time;
  };

  public type DeployedInfo = {
    deployedAt : Time.Time;
  };

  public type FailureInfo = {
    errorMessage : Text;
    lastDeploymentStatus : DeploymentStatus;
    failedAt : Time.Time;
  };

  public type DeploymentStatus = {
    #queued; // Queued for deployment
    #deploying : DeployingInfo; // Currently being deployed with details
    #deployed : DeployedInfo; // Successfully deployed
    #failed : FailureInfo; // Deployment failed with details
  };

  public type DeploymentInfo = {
    status : DeploymentStatus;
    canisterIds : Types.CodeCanisterList;
    createdAt : Time.Time;
    lastUpdate : Time.Time;
    initialInvestmentCompleted : Bool;
  };

  public type DeploymentState = {
    deploymentMap : Map.Map<Text, DeploymentInfo>;
    wasmCodeMap : Types.WasmCodeMap;
  };

  // Deployment status update functions
  // NOTE: need to set first deployment info, then update the status
  private func updateDeployingStep(state : DeploymentState, daoId : Text, step : DeployingStep) {
    let now = Time.now();
    switch (Map.get(state.deploymentMap, thash, daoId)) {
      case (?deploymentInfo) {
        let deployInfo = switch (deploymentInfo.status) {
          case (#deploying(deployingInfo)) {
            { deployingInfo with step = step };
          };
          case _ { { step = step; startedAt = now } };
        };
        let newDeploymentInfo = {
          deploymentInfo with
          status = #deploying(deployInfo);
          lastUpdate = now;
        };
        Map.set(state.deploymentMap, thash, daoId, newDeploymentInfo);
      };
      case null {};
    };
  };

  public func updateDeployFailed(state : DeploymentState, daoId : Text, errorMessage : Text) {
    switch (Map.get(state.deploymentMap, thash, daoId)) {
      case (?deploymentInfo) {
        let now = Time.now();
        Map.set(
          state.deploymentMap,
          thash,
          daoId,
          {
            deploymentInfo with
            status = #failed({
              errorMessage = errorMessage;
              failedAt = now;
              lastDeploymentStatus = deploymentInfo.status;
            });
            lastUpdate = now;
          },
        );
      };
      case null {};
    };
  };

  private func updateDeploymentCompleted(state : DeploymentState, daoId : Text) {
    switch (Map.get(state.deploymentMap, thash, daoId)) {
      case (?deploymentInfo) {
        let now = Time.now();
        Map.set(
          state.deploymentMap,
          thash,
          daoId,
          {
            deploymentInfo with
            status = #deployed({
              deployedAt = now;
            });
            lastUpdate = now;
          },
        );
      };
      case null {};
    };
  };

  private func setCanisterIds(state : DeploymentState, daoId : Text, canisterIds : Types.CodeCanisterList) {
    switch (Map.get(state.deploymentMap, thash, daoId)) {
      case (?deploymentInfo) {
        Map.set(
          state.deploymentMap,
          thash,
          daoId,
          {
            deploymentInfo with
            canisterIds = canisterIds;
            lastUpdate = Time.now();
          },
        );
      };
      case null {};
    };
  };

  type DeploymentManagerRequest = {
    dao : CommonTypes.DAOEntry;
    controller : Principal;
    mainTokenLedger : Principal;
  };

  // it's here
  public func checkWasmForDeployment(state : DeploymentState) : Result.Result<(), Text> {
    for (key in Types.wasmCodeTypes.vals()) {
      switch (Map.get(state.wasmCodeMap, n8hash, Types.getWasmCodeKey(key))) {
        case null {
          return #err("WASM code not found for key: " # debug_show (key));
        };
        case _ {};
      };
    };
    #ok();
  };

  /**
    * Execute deployment steps.
    * Make sure the wasm code is installed (checkWasmForDeployment) before running this function.
    */
  public func deploy(state : DeploymentState, request : DeploymentManagerRequest) : async () {
    let dao = request.dao;
    let controller = request.controller;

    let daoId = dao.id;
    Map.set(
      state.deploymentMap,
      thash,
      daoId,
      {
        status = #queued;
        canisterIds = List.nil();
        createdAt = Time.now();
        lastUpdate = Time.now();
        initialInvestmentCompleted = false;
      },
    );

    try {
      // Step 1: Create canister
      Debug.print("Creating Canister for DAO " # debug_show (daoId));

      // Create canister with cycles (1T cycles)
      func createCanisterWithCycles() : async Principal {
        let result = await (with cycles = 1_000_000_000_000) ic.create_canister({
          sender_canister_version = null;
          settings = ?{
            controllers = ?[controller];
            compute_allocation = null;
            memory_allocation = null;
            freezing_threshold = null;
            log_visibility = null;
            wasm_memory_limit = null;
            wasm_memory_threshold = null;
            reserved_cycles_limit = null;
          };
        });
        result.canister_id;
      };

      // Create all required canisters
      var canisterIds : Types.CodeCanisterList = List.nil();
      for (key in Types.wasmCodeTypes.vals()) {
        updateDeployingStep(state, daoId, #creating_canister(key));
        let canisterId = await createCanisterWithCycles();
        canisterIds := List.push((key, canisterId), canisterIds);
      };
      setCanisterIds(state, daoId, canisterIds);
      Debug.print("Created Canister " # debug_show (daoId) # " with canisterIds: " # debug_show (canisterIds));

      // Step 2: Install code
      // Get WASM code from the manager
      Debug.print("Installing code for DAO " # debug_show (daoId));
      var ledgerCanisterId = Types.getCodePrincipal(canisterIds, #ledger);
      var ammCanisterId = Types.getCodePrincipal(canisterIds, #swap);
      for ((key, canisterId) in List.toIter(canisterIds)) {
        switch (Map.get(state.wasmCodeMap, n8hash, Types.getWasmCodeKey(key))) {
          case (?wasmInfo) {
            updateDeployingStep(state, daoId, #installing_code(key));
            let arg = switch (key) {
              case (#ledger) to_candid (
                #Init {
                  token_symbol = "SUDAGOV";
                  token_name = "SUDAO GOVERNANCE TOKEN";
                  minting_account = {
                    owner = Principal.fromText("zwrsw-mep5i-qxaw3-rjicp-ighsc-jxa2e-rmk2r-2sunl-p2lkj-nutli-dqe");
                  };
                  transfer_fee = 10;
                  metadata = [];
                  feature_flags = ?{ icrc2 = true };
                  initial_balances = [(
                    { owner = ammCanisterId }, // Give tokens to actual AMM canister
                    1000000000,
                  )];
                  archive_options = {
                    num_blocks_to_archive = 1000 : Nat64;
                    trigger_threshold = 1000 : Nat64;
                    controller_id = controller;
                  };
                }
              );
              case (#backend) to_candid (dao, ledgerCanisterId);
              case (#swap) to_candid ({
                token0_ledger_id = request.mainTokenLedger;
                token1_ledger_id = ledgerCanisterId;
                owner = controller;
              });
            };
            let wasmCode = wasmInfo.code;
            await ic.install_code({
              arg = arg;
              wasm_module = wasmCode;
              mode = #install;
              canister_id = canisterId;
              sender_canister_version = null;
            });
          };
          case _ {};
        };
      };
      Debug.print("Installed code for DAO " # debug_show (daoId));

      // Step 3: Initialize AMM
      Debug.print("Add liquidity to AMM for DAO " # debug_show (daoId));

      // Initialize AMM with token IDs
      let ammActor = actor (Principal.toText(ammCanisterId)) : actor {
        add_liquidity : (AMMTypes.AddLiquidityArgs) -> async AMMTypes.CommonAMMResult;
      };

      // Add initial liquidity
      let liquidityResult = await ammActor.add_liquidity({
        amount0_desired = 1000; // 1000 ICP
        amount1_desired = 1000000; // 1M governance tokens
        amount0_min = ?0;
        amount1_min = ?0;
      });

      switch (liquidityResult) {
        case (#ok(lpTokens)) {
          Debug.print("Initial liquidity added: " # debug_show (lpTokens) # " LP tokens");
        };
        case (#err(error)) {
          throw Error.reject("Failed to add initial liquidity: " # debug_show (error));
        };
      };

      // Step 4: Complete
      Debug.print("Deployment completed for DAO " # debug_show (daoId));
      updateDeploymentCompleted(state, daoId);
    } catch (error) {
      // Handle deployment failure
      let errorMsg = "Deployment failed: " # Error.message(error);
      Debug.print(errorMsg);

      updateDeployFailed(state, daoId, errorMsg);
    };
  };

  public func getCanisterId(state : DeploymentState, daoId : Text) : ?Principal {
    let (?deploymentInfo) = Map.get(state.deploymentMap, thash, daoId) else {
      return null;
    };
    let ?(_, canisterId) = List.last(deploymentInfo.canisterIds) else {
      return null;
    };
    ?canisterId;
  };

  public func getDeploymentInfo(state : DeploymentState, daoId : Text) : ?DeploymentInfo {
    Map.get(state.deploymentMap, thash, daoId);
  };

  public type DeploymentStats = {
    deployedDAOs : Nat;
    pendingDAOs : Nat; // This now represents "deploying" DAOs
    failedDAOs : Nat;
  };

  public func getDeploymentStats(state : DeploymentState) : DeploymentStats {
    var deployedDAOs = 0;
    var pendingDAOs = 0;
    var failedDAOs = 0;

    for (deploymentInfo in Map.vals(state.deploymentMap)) {
      switch (deploymentInfo.status) {
        case (#deployed(_)) deployedDAOs += 1;
        case (#deploying(_)) pendingDAOs += 1;
        case (#failed(_)) failedDAOs += 1;
        case _ {};
      };
    };

    {
      deployedDAOs = deployedDAOs;
      pendingDAOs = pendingDAOs;
      failedDAOs = failedDAOs;
    };
  };

  /**
     * Mark initial investment as completed for a DAO
     */
  public func markInitialInvestmentCompleted(state : DeploymentState, daoId : Text) : Bool {
    switch (Map.get(state.deploymentMap, thash, daoId)) {
      case (?deploymentInfo) {
        let updatedDeploymentInfo = {
          deploymentInfo with
          initialInvestmentCompleted = true;
          lastUpdate = Time.now();
        };
        Map.set(state.deploymentMap, thash, daoId, updatedDeploymentInfo);
        true;
      };
      case null {
        false // DAO not found
      };
    };
  };

  /**
     * Check if initial investment is completed for a DAO
     */
  public func isInitialInvestmentCompleted(state : DeploymentState, daoId : Text) : Bool {
    switch (Map.get(state.deploymentMap, thash, daoId)) {
      case (?deploymentInfo) {
        deploymentInfo.initialInvestmentCompleted;
      };
      case null {
        false // DAO not found, treat as not completed
      };
    };
  };
};
