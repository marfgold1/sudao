import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Time "mo:base/Time";
import Result "mo:base/Result";

// Import our modular components
import Types "Types";
import DAOManager "DAOManager";
import DeploymentManager "DeploymentManager";
import Middleware "../common/Middleware";
import BinaryManager "BinaryManager";

/**
 * DAO Explorer - A management canister for creating and deploying DAOs
 * 
 * This canister serves as a DAO factory and manager that can:
 * 1. Add new DAOs with metadata (name, description, tags) and automatically start deployment
 * 2. Track deployment status directly in DAO entries
 * 3. List and query DAOs with various filters
 * 4. Manage WASM code for DAO deployments
 * 
 * Usage Flow:
 * 1. Upload WASM code via setWasmCode() (admin only)
 * 2. Call addDAO() to register a new DAO - deployment starts immediately and asynchronously
 * 3. Use getDAO() to check deployment progress at any time
 * 4. Use listDAOs() to see all managed DAOs
 * 5. Each deployed DAO becomes an independent canister with the sudao_backend functionality
 */
actor DAOExplorer {

    // Stable storage for upgrades
    private stable var systemStartTime : Time.Time = Time.now();
    private stable var canisterId : Principal = Principal.fromActor(DAOExplorer);
    private stable var admins : ?[Principal] = null;

    // Initialize managers with stable data
    private stable var daoEntries : [(Text, Types.DAOEntry)] = [];
    private stable var nextDAOId : Nat = 1;
    private var daoManager = DAOManager.DAOManager(Map.fromIter(daoEntries.vals(), thash));

    private stable var wasmInfo : ?Types.WasmInfo = null;
    private var binaryManager = BinaryManager.BinaryManager();

    private var deploymentManager = DeploymentManager.DeploymentManager();

    // System hooks for stable variables
    system func preupgrade() {
        let daoData = daoManager.stableGet();
        daoEntries := Map.toArray(daoData.0);
        nextDAOId := daoData.1;

        wasmInfo := binaryManager.stableGet();
    };

    system func postupgrade() {
        daoManager.stableSet(nextDAOId);
        daoEntries := [];

        binaryManager.stableSet(wasmInfo);
        wasmInfo := null;
    };

    private func getControllers() : async [Principal] {
        switch (admins) {
            case (?admins) admins;
            case null await Middleware.getControllers(canisterId);
        }
    };

    private func isController(caller : Principal) : async Bool {
        await Middleware.isController(caller, await getControllers())
    };

    /**
     * Set WASM code for DAO deployments (admin only)
     * This should be called after building the sudao_backend
     */
    public shared(msg) func setWasmCode(wasmCode: Blob, version: Text) : async Result.Result<(), Text> {
        // Check if caller is a controller of this canister
        if (not (await isController(msg.caller))) {
            return #err("Only canister controllers can set WASM code");
        };
        
        binaryManager.setWasmCode(wasmCode, version, msg.caller)
    };

    /**
     * Get WASM info
     */
    public query func getWasmInfo() : async ?Types.WasmInfo {
        binaryManager.getWasmInfo()
    };

    // --- PUBLIC API ---
    /**
     * Add a new DAO to the platform and automatically start deployment
     * Returns immediately with the DAO ID while deployment happens asynchronously
     */
    public shared(msg) func addDAO(request : Types.CreateDAORequest) : async Result.Result<Text, Text> {
        // Check if WASM code is available
        let (?wasmCode) = binaryManager.getWasmCode() else {
            return #err("No WASM code available for deployment. Please upload WASM code first.");
        };
        
        switch (daoManager.addDAO(request, msg.caller)) {
            case (#ok(dao)) {
                // Trigger deployment asynchronously (fire and forget)
                await* deploymentManager.deploy(daoManager, dao, canisterId, wasmCode);
                #ok(dao.id)
            };
            case (#err(error)) {
                #err(error)
            };
        }
    };

    /**
     * Get DAO with current deployment status
     * Use this to check deployment progress
     */
    public query func getDAO(daoId : Text) : async ?Types.DAOEntry {
        daoManager.getDAO(daoId)
    };

    /**
     * List all DAOs
     */
    public query func listDAOs() : async [Types.DAOEntry] {
        daoManager.listDAOs()
    };

    /**
     * Get canister ID for a deployed DAO
     */
    public query func getCanisterId(daoId : Text) : async ?Principal {
        daoManager.getCanisterId(daoId)
    };

    /**
     * Check if WASM code is available
     */
    public query func hasWasmCode() : async Bool {
        binaryManager.hasWasmCode()
    };

    /**
     * Get system information
     */
    public query func getSystemInfo() : async {
        totalDAOs : Nat;
        systemStartTime : Time.Time;
        explorerPrincipal : Principal;
        hasWasmCode : Bool;
    } {
        let stats = daoManager.getStats(systemStartTime);
        {
            totalDAOs = stats.totalDAOs;
            systemStartTime = systemStartTime;
            explorerPrincipal = Principal.fromActor(DAOExplorer);
            hasWasmCode = binaryManager.hasWasmCode();
        }
    };
};
