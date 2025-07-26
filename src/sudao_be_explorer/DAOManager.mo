import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

import CommonTypes "../common/Types";

module {
    // Request/Response types
    public type CreateDAORequest = {
        name : Text;
        description : Text;
        tags : [Text];
    };

    public type DAOState = {
        daoEntries : Map.Map<Text, CommonTypes.DAOEntry>;
        nextDAOId : Nat;
    };

    /**
    * Add a new DAO to the registry and automatically start deployment
    */
    public func addDAO(state : DAOState, request : CreateDAORequest, creator : Principal) : Result.Result<(DAOState, CommonTypes.DAOEntry), Text> {
        // Validate input
        if (request.name == "") {
            return #err("DAO name cannot be empty");
        };
        if (request.description == "") {
            return #err("DAO description cannot be empty");
        };

        // Generate unique ID
        let daoId = "dao_" # Nat.toText(state.nextDAOId);

        // Create DAO entry with deployment already started
        let newDAO : CommonTypes.DAOEntry = {
            id = daoId;
            name = request.name;
            description = request.description;
            tags = request.tags;
            createdAt = Time.now();
            creator = creator;
        };

        // Store DAO
        Map.set(state.daoEntries, thash, daoId, newDAO);

        #ok(({ state with nextDAOId = state.nextDAOId + 1; }, newDAO))
    };

    /**
    * Get a specific DAO by ID
    */
    public func getDAO(state : DAOState, daoId : Text) : ?CommonTypes.DAOEntry {
        Map.get(state.daoEntries, thash, daoId)
    };

    /**
    * List all DAOs
    */
    public func listDAOs(state : DAOState) : Iter.Iter<CommonTypes.DAOEntry> {
        Map.vals(state.daoEntries) 
    };

    public type DAOStats = {
        totalDAOs : Nat;
    };

    public func getDAOsStats(state : DAOState) : DAOStats {
        { totalDAOs = Map.size(state.daoEntries); };
    };
}; 