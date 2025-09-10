import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

// Import our modular components
import Types "Types";
import DeploymentManager "DeploymentManager";
import Middleware "../common/Middleware";
import BinaryManager "BinaryManager";
import DaoManager "DAOManager";
import CommonTypes "../common/Types";

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
persistent actor DAOExplorer {
    // Stable storage for upgrades
    private var systemStartTime : Time.Time = Time.now();
    private var canisterId : Principal = Principal.fromActor(DAOExplorer);
    private var admins : ?[Principal] = null;

    private var daoState : DaoManager.DAOState = {
        daoEntries = Map.new<Text, CommonTypes.DAOEntry>();
        nextDAOId = 0;
    };

    private var deploymentState : DeploymentManager.DeploymentState = {
        deploymentMap = Map.new<Text, DeploymentManager.DeploymentInfo>();
        wasmCodeMap = Map.new<Nat8, Types.WasmInfo>();
    };

    private var chunkUploadState : BinaryManager.ChunkUploadMap = Map.new<Text, BinaryManager.ChunkUploadState>();

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
    public shared(msg) func setWasmCode(codeType : Types.WasmCodeType, wasmCode: Blob, version: Text) : async Result.Result<(), Text> {
        // Check if caller is a controller of this canister
        if (not (await isController(msg.caller))) {
            return #err("Only canister controllers can set WASM code");
        };
        
        BinaryManager.setWasmCode(deploymentState.wasmCodeMap, {
            codeType = codeType;
            code = wasmCode;
            version = version;
            uploader = msg.caller;
        })
    };

    /**
     * Upload WASM code in chunks for large files
     */
    public shared(msg) func uploadWasmChunk(
        codeType : Types.WasmCodeType, 
        chunk: Blob, 
        chunkIndex: Nat, 
        totalChunks: Nat, 
        version: Text
    ) : async Result.Result<Text, Text> {
        // Check if caller is a controller of this canister
        if (not (await isController(msg.caller))) {
            return #err("Only canister controllers can upload WASM code");
        };
        
        BinaryManager.uploadWasmChunk(
            deploymentState.wasmCodeMap, 
            chunkUploadState, 
            {
                codeType = codeType;
                chunk = chunk;
                chunkIndex = chunkIndex;
                totalChunks = totalChunks;
                version = version;
                uploader = msg.caller;
            }
        )
    };

    /**
     * Get chunk upload status
     */
    public query func getChunkUploadStatus(codeType : Types.WasmCodeType) : async ?{receivedChunks : Nat; totalChunks : Nat} {
        BinaryManager.getChunkUploadStatus(chunkUploadState, codeType)
    };

    /**
     * Get WASM code size for debugging
     */
    public query func getWasmCodeSize(key : Types.WasmCodeType) : async ?Nat {
        switch (BinaryManager.getWasmCode(deploymentState.wasmCodeMap, key)) {
            case (?wasmCode) ?wasmCode.size();
            case null null;
        }
    };

    /**
     * Get first 32 bytes of WASM code for debugging
     */
    public query func getWasmCodeHeader(key : Types.WasmCodeType) : async ?[Nat8] {
        switch (BinaryManager.getWasmCode(deploymentState.wasmCodeMap, key)) {
            case (?wasmCode) {
                let bytes = Blob.toArray(wasmCode);
                if (bytes.size() > 32) {
                    ?Array.subArray(bytes, 0, 32)
                } else {
                    ?bytes
                }
            };
            case null null;
        }
    };

    /**
     * Get WASM info
     */
    public query func getWasmInfo(key : Types.WasmCodeType) : async ?Types.WasmInfo {
        switch (BinaryManager.getWasmInfo(deploymentState.wasmCodeMap, key)) {
            case (?info) {
                ?{
                    code = Blob.fromArray([]);
                    uploadedAt = info.uploadedAt;
                    uploadedBy = info.uploadedBy;
                    version = info.version;
                };
            };
            case null null;
        }
    };

    // --- PUBLIC API ---
    /**
     * Add a new DAO to the platform and automatically start deployment
     * Returns immediately with the DAO ID while deployment happens asynchronously
     */
    public shared(msg) func addDAO(request : DaoManager.CreateDAORequest) : async Result.Result<Text, Text> {
        // Check if WASM code is available
        switch (DeploymentManager.checkWasmForDeployment(deploymentState)) {
            case (#err(error)) return #err(error);
            case (#ok) {};
        };
        
        switch (DaoManager.addDAO(daoState, request, msg.caller)) {
            case (#ok((newDaoState, dao))) {
                // Trigger deployment asynchronously (fire and forget)
                daoState := newDaoState;
                ignore DeploymentManager.deploy(deploymentState, {
                    dao = dao;
                    controller = canisterId;
                    mainTokenLedger = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"); // ICP
                });
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
    public query func getDAO(daoId : Text) : async (?CommonTypes.DAOEntry, ?DeploymentManager.DeploymentInfo) {
        (DaoManager.getDAO(daoState, daoId), DeploymentManager.getDeploymentInfo(deploymentState, daoId))
    };

    /**
     * List all DAOs
     */
    public query func listDAOs() : async [(CommonTypes.DAOEntry, ?DeploymentManager.DeploymentInfo)] {
        Iter.toArray(Iter.map<CommonTypes.DAOEntry, (CommonTypes.DAOEntry, ?DeploymentManager.DeploymentInfo)>(
            DaoManager.listDAOs(daoState), func (dao) { (dao, DeploymentManager.getDeploymentInfo(deploymentState, dao.id)) }
        ))
    };

    /**
     * Get canister ID for a deployed DAO
     */
    public query func getCanisterId(daoId : Text) : async ?Principal {
        DeploymentManager.getCanisterId(deploymentState, daoId)
    };

    /**
     * Check if WASM code is available
     */
    public query func hasWasmCode(wasmCodeType : Types.WasmCodeType) : async Bool {
        BinaryManager.hasWasmCode(deploymentState.wasmCodeMap, wasmCodeType)
    };

    public query func isDeploymentReady() : async Result.Result<(), Text> {
        DeploymentManager.checkWasmForDeployment(deploymentState)
    };

    /**
     * Get system information
     */
    public query func getSystemInfo() : async {
        daoStats : DaoManager.DAOStats;
        systemStartTime : Time.Time;
        explorerPrincipal : Principal;
        deploymentStats : DeploymentManager.DeploymentStats;
        wasmReady : Result.Result<(), Text>;
    } {
        let deploymentStats = DeploymentManager.getDeploymentStats(deploymentState);
        let daoStats = DaoManager.getDAOsStats(daoState);
        {
            daoStats = daoStats;
            systemStartTime = systemStartTime;
            explorerPrincipal = canisterId;
            deploymentStats = deploymentStats;
            wasmReady = DeploymentManager.checkWasmForDeployment(deploymentState);
        }
    };
};
