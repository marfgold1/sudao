import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Map "mo:map/Map";
import { phash } "mo:map/Map";

import Types "./Types";
import Utils "./Utils";
import UserService "./UserService";

actor {
  // Stable variable for user registry (keeping same name for migration)
  private stable var userRegistry : Map.Map<Principal, Types.UserProfile> = Map.new<Principal, Types.UserProfile>();

  // Initialize the user service with the registry
  private let userService = UserService.UserService(?userRegistry);

  // System startup time
  private let systemStartTime = Time.now();

  /**
   * Registers the calling user in the system.
   * This is idempotent - calling it multiple times has no additional effect.
   */
  public shared (msg) func register() : async Text {
    let callerPrincipal = msg.caller;
    Utils.logInfo("Registration request from: " # Principal.toText(callerPrincipal));

    switch (userService.registerUser(callerPrincipal)) {
      case (#Success(message)) {
        Utils.logInfo("Registration successful");
        message;
      };
      case (#AlreadyRegistered(message)) {
        Utils.logInfo("User already registered");
        message;
      };
      case (#Error(message)) {
        Utils.logError("Registration failed: " # message);
        "Registration failed: " # message;
      };
    };
  };

  /**
   * Gets the profile of the calling user.
   */
  public shared query (msg) func getMyProfile() : async ?Types.UserProfile {
    let callerPrincipal = msg.caller;
    Utils.logInfo("Profile request from: " # Principal.toText(callerPrincipal));

    switch (userService.getUserProfile(callerPrincipal)) {
      case (#Found(profile)) {
        ?profile;
      };
      case (#NotFound(_)) {
        null;
      };
    };
  };

  /**
   * Checks if the calling user is registered.
   */
  public shared query (msg) func isRegistered() : async Bool {
    let callerPrincipal = msg.caller;
    userService.userExists(callerPrincipal);
  };

  /**
   * Gets system information (total users, etc.).
   */
  public query func getSystemInfo() : async Types.SystemInfo {
    let info = userService.getSystemInfo();
    {
      totalUsers = info.totalUsers;
      systemStartTime = systemStartTime; // Use actual system start time
    };
  };

  /**
   * Gets the total number of registered users.
   */
  public query func getUserCount() : async Nat {
    userService.getUserCount();
  };

  /**
   * Returns a greeting for the given name.
   * This is a simple public function for testing.
   */
  public query func greet(name : Text) : async Text {
    Utils.logInfo("Greeting request for: " # name);
    "Hello, " # name # "! Welcome to the SUDAO backend.";
  };

  /**
   * Health check endpoint.
   */
  public query func health() : async Text {
    "Backend is running. Total users: " # Nat.toText(userService.getUserCount());
  };

  // System upgrade hooks
  system func preupgrade() {
    Utils.logInfo("System upgrade starting");
    // Save the current registry state
    userRegistry := userService.getRegistry();
  };

  system func postupgrade() {
    Utils.logInfo("System upgrade completed");
    // Registry is automatically restored from userRegistryStable
  };
};
