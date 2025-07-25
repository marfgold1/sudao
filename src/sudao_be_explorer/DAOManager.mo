import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

import Types "Types";

module {
    public type DAORegistry = Map.Map<Text, Types.DAOEntry>;

    public class DAOManager(initialRegistry : DAORegistry) {
        private var daos : DAORegistry = initialRegistry;

        private var nextDAOId : Nat = 1;

        /**
         * Add a new DAO to the registry and automatically start deployment
         */
        public func addDAO(request : Types.CreateDAORequest, creator : Principal) : Result.Result<Types.DAOEntry, Text> {
            // Validate input
            if (request.name == "") {
                return #err("DAO name cannot be empty");
            };
            if (request.description == "") {
                return #err("DAO description cannot be empty");
            };

            // Generate unique ID
            let daoId = "dao_" # Nat.toText(nextDAOId);
            nextDAOId += 1;

            // Create DAO entry with deployment already started
            let newDAO : Types.DAOEntry = {
                id = daoId;
                name = request.name;
                description = request.description;
                tags = request.tags;
                deploymentStatus = #deploying({
                    step = #queued;
                    startedAt = Time.now();
                    lastUpdate = Time.now();
                });
                createdAt = Time.now();
                creator = creator;
            };

            // Store DAO
            Map.set(daos, thash, daoId, newDAO);

            #ok(newDAO)
        };

        /**
         * Get a specific DAO by ID
         */
        public func getDAO(daoId : Text) : ?Types.DAOEntry {
            Map.get(daos, thash, daoId)
        };

        /**
         * Update deployment step
         */
        public func updateDeploymentStep(daoId : Text, step : Types.DeploymentStep) : Bool {
            switch (Map.get(daos, thash, daoId)) {
                case (?dao) {
                    switch (dao.deploymentStatus) {
                        case (#deploying(progress)) {
                            let updatedDAO = {
                                dao with 
                                deploymentStatus = #deploying({
                                    progress with
                                    step = step;
                                    lastUpdate = Time.now();
                                });
                            };
                            Map.set(daos, thash, daoId, updatedDAO);
                            true
                        };
                        case _ false; // Can only update step if currently deploying
                    }
                };
                case null false;
            }
        };

        /**
         * Mark deployment as completed
         */
        public func markDeploymentCompleted(daoId : Text, canisterId : Principal) : Bool {
            switch (Map.get(daos, thash, daoId)) {
                case (?dao) {
                    let updatedDAO = {
                        dao with 
                        deploymentStatus = #deployed({
                            canisterId = canisterId;
                            deployedAt = Time.now();
                        });
                    };
                    Map.set(daos, thash, daoId, updatedDAO);
                    true
                };
                case null false;
            }
        };

        /**
         * Mark deployment as failed
         */
        public func markDeploymentFailed(daoId : Text, error : Text) : Bool {
            switch (Map.get(daos, thash, daoId)) {
                case (?dao) {
                    let updatedDAO = {
                        dao with 
                        deploymentStatus = #failed({
                            error = error;
                            failedAt = Time.now();
                        });
                    };
                    Map.set(daos, thash, daoId, updatedDAO);
                    true
                };
                case null false;
            }
        };

        /**
         * List all DAOs
         */
        public func listDAOs() : [Types.DAOEntry] {
            Map.vals(daos) 
            |> Iter.toArray(_)
        };

        /**
         * Get DAOs by deployment status
         */
        public func getDAOsByStatus(statusFilter : {#deploying; #deployed; #failed}) : [Types.DAOEntry] {
            Map.vals(daos)
            |> Iter.filter(_, func(dao : Types.DAOEntry) : Bool {
                switch (dao.deploymentStatus, statusFilter) {
                    case (#deploying(_), #deploying) true;
                    case (#deployed(_), #deployed) true;
                    case (#failed(_), #failed) true;
                    case _ false;
                }
            })
            |> Iter.toArray(_)
        };

        /**
         * Get platform statistics
         */
        public func getStats(systemStartTime : Time.Time) : Types.PlatformStats {
            let allDAOs = Map.vals(daos) |> Iter.toArray(_);
            var deployed = 0;
            var deploying = 0; // Renamed from pending
            var failed = 0;

            for (dao in allDAOs.vals()) {
                switch (dao.deploymentStatus) {
                    case (#deployed(_)) deployed += 1;
                    case (#deploying(_)) deploying += 1;
                    case (#failed(_)) failed += 1;
                };
            };

            {
                totalDAOs = allDAOs.size();
                deployedDAOs = deployed;
                pendingDAOs = deploying; // This now represents "deploying" DAOs
                failedDAOs = failed;
                systemStartTime = systemStartTime;
            }
        };

        /**
         * Get canister ID for deployed DAO
         */
        public func getCanisterId(daoId : Text) : ?Principal {
            switch (Map.get(daos, thash, daoId)) {
                case (?dao) {
                    switch (dao.deploymentStatus) {
                        case (#deployed(info)) ?info.canisterId;
                        case _ null;
                    }
                };
                case null null;
            }
        };

        /**
         * STABLE ONLY: Get the DAO registry and next DAO ID
         */
        public func stableGet() : (DAORegistry, Nat) {
            (daos, nextDAOId)
        };

        /**
         * STABLE ONLY: Set the DAO registry and next DAO ID
         */
        public func stableSet(id : Nat) {
            nextDAOId := id;
        };
    };
}; 