import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";

import Types "../Types";
import Utils "../Utils";

module {
  public type UserRegistry = Map.Map<Principal, Types.UserProfile>;

  public class UserService(initialRegistry : ?UserRegistry) {
    private var userRegistry : UserRegistry = switch (initialRegistry) {
      case (?registry) registry;
      case null Map.new<Principal, Types.UserProfile>();
    };

    // Register a new user
    public func registerUser(principal : Principal) : Types.RegistrationResult {
      Utils.logInfo("Attempting to register user: " # Principal.toText(principal));

      // Validate principal
      if (not Utils.isValidPrincipal(principal)) {
        Utils.logError("Invalid principal provided for registration");
        return #Error("Invalid principal provided");
      };

      // Check if user already exists
      switch (Map.get(userRegistry, phash, principal)) {
        case (?_existingProfile) {
          Utils.logInfo("User already registered: " # Principal.toText(principal));
          return #AlreadyRegistered("You are already registered.");
        };
        case null {
          // Create new user profile
          let newProfile : Types.UserProfile = {
            principal = principal;
            firstRegistered = Time.now();
          };

          // Save to registry
          Map.set(userRegistry, phash, principal, newProfile);
          Utils.logInfo("User successfully registered: " # Principal.toText(principal));
          return #Success("Your Principal has been registered in the backend");
        };
      };
    };

    // Get user profile
    public func getUserProfile(principal : Principal) : Types.ProfileResult {
      Utils.logInfo("Retrieving profile for user: " # Principal.toText(principal));

      switch (Map.get(userRegistry, phash, principal)) {
        case (?profile) {
          Utils.logInfo("Profile found for user: " # Principal.toText(principal));
          return #Found(profile);
        };
        case null {
          Utils.logInfo("No profile found for user: " # Principal.toText(principal));
          return #NotFound("User profile not found");
        };
      };
    };

    // Get system information (base info without DAO details)
    public func getSystemInfo() : Types.BaseSystemInfo {
      let totalUsers = Map.size(userRegistry);
      Utils.logInfo("System info requested - Total users: " # Nat.toText(totalUsers));

      {
        totalUsers = totalUsers;
        systemStartTime = Time.now(); // In a real system, this would be stored
      };
    };

    // Check if user exists
    public func userExists(principal : Principal) : Bool {
      switch (Map.get(userRegistry, phash, principal)) {
        case (?_) true;
        case null false;
      };
    };

    // Get all registered users (admin function)
    public func getAllUsers() : [Types.UserProfile] {
      Utils.logInfo("Retrieving all users");
      Map.vals(userRegistry) |> Iter.toArray(_);
    };

    // Get user count
    public func getUserCount() : Nat {
      Map.size(userRegistry);
    };

    // Get the registry (for stable variable handling)
    public func getRegistry() : UserRegistry {
      userRegistry;
    };
  };
};
