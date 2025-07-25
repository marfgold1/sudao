import Principal "mo:base/Principal";
import Time "mo:base/Time";

module {
    // Enhanced deployment status with more granular tracking
    public type DeploymentStatus = {
        #deploying : DeploymentProgress;    // Currently being deployed with details
        #deployed : DeployedInfo;           // Successfully deployed
        #failed : FailureInfo;              // Deployment failed with details
    };

    public type DeploymentProgress = {
        step : DeploymentStep;
        startedAt : Time.Time;
        lastUpdate : Time.Time;
    };

    public type DeploymentStep = {
        #queued;
        #creating_canister;
        #installing_code;
        #initializing;
    };

    public type DeployedInfo = {
        canisterId : Principal;
        deployedAt : Time.Time;
    };

    public type FailureInfo = {
        error : Text;
        failedAt : Time.Time;
    };

    // DAO-related types
    public type DAOEntry = {
        id : Text;
        name : Text;
        description : Text;
        tags : [Text];
        deploymentStatus : DeploymentStatus;
        createdAt : Time.Time;
        creator : Principal;
    };

    // Request/Response types
    public type CreateDAORequest = {
        name : Text;
        description : Text;
        tags : [Text];
    };

    public type PlatformStats = {
        totalDAOs : Nat;
        deployedDAOs : Nat;
        pendingDAOs : Nat;  // This now represents "deploying" DAOs
        failedDAOs : Nat;
        systemStartTime : Time.Time;
    };

    // WASM management types
    public type WasmInfo = {
        code : Blob;
        version : Text;
        uploadedAt : Time.Time;
        uploadedBy : Principal;
    };
};