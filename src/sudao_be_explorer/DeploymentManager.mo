import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Debug "mo:base/Debug";

import Types "Types";
import {ic} "mo:ic";
import DAO "./DAOManager";

module {
    public class DeploymentManager() {
        /**
         * Execute deployment steps
         */
        public func deploy(daoManager : DAO.DAOManager, dao : Types.DAOEntry, controller : Principal, wasmCode : Blob) : async* () {
            let daoId = dao.id;

            try {
                // Step 1: Create canister
                if (not daoManager.updateDeploymentStep(daoId, #creating_canister)) {
                    throw Error.reject("Failed to update deployment step to creating canister");
                };
                Debug.print("Creating Canister for DAO " # debug_show(daoId));

                // Create canister with cycles (500B cycles)  
                let createResult = await (with cycles = 500_000_000_000) ic.create_canister({
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
                Debug.print("Created Canister " # debug_show(daoId));

                let canisterId = createResult.canister_id;

                // Step 2: Install code
                if (not daoManager.updateDeploymentStep(daoId, #installing_code)) {
                    throw Error.reject("Failed to update deployment step to installing code");
                };

                // Get WASM code from the manager
                Debug.print("Installing code for DAO " # debug_show(daoId));
                await ic.install_code({
                    arg = to_candid();
                    wasm_module = wasmCode;
                    mode = #install;
                    canister_id = canisterId;
                    sender_canister_version = null;
                });
                Debug.print("Installed code for DAO " # debug_show(daoId));
                // Step 3: Initialize DAO
                if (not daoManager.updateDeploymentStep(daoId, #initializing)) {
                    throw Error.reject("Failed to update deployment step to initializing");
                };

                // Initialize the DAO with its information
                Debug.print("Initializing DAO " # debug_show(daoId));
                let daoActor = actor(Principal.toText(canisterId)) : actor {
                    initializeDAO : (Text, Text, [Text], Principal) -> async Result.Result<(), Text>;
                };
                let initResult = await daoActor.initializeDAO(
                    dao.name, dao.description, dao.tags, dao.creator
                );
                Debug.print("Initialized DAO " # debug_show(daoId));
                
                switch (initResult) {
                    case (#ok) {
                        // Step 4: Complete
                        if (not daoManager.markDeploymentCompleted(daoId, canisterId)) {
                            throw Error.reject("Failed to mark deployment as completed");
                        };
                    };
                    case (#err error) {
                        throw Error.reject(error);
                    }
                };

            } catch (error) {
                // Handle deployment failure
                let errorMsg = "Deployment failed: " # Error.message(error);
                Debug.print("Deployment failed: " # debug_show(errorMsg));
                
                ignore daoManager.markDeploymentFailed(daoId, errorMsg);
            };
        };
    };
}; 