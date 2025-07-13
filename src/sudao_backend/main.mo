import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { phash } "mo:map/Map";
import Time "mo:base/Time";

actor {

  // Define the shape of a user profile
  public type UserProfile = {
    principal : Principal;
    firstRegistered : Time.Time;
  };

  // Use a HashMap for the user registry .
  private stable var userRegistry = Map.new<Principal, UserProfile>();

  /**
     * Registers the calling user in the system.
     * `msg.caller` automatically provides the Principal of the user who signed this call.
     * This is idempotent, meaning calling it multiple times does nothing new.
     */
  public shared (msg) func register() : async Text {
    let callerPrincipal = msg.caller;

    // Check if the user's Principal is already in our registry
    if (Map.get(userRegistry, phash, callerPrincipal) != null) {
      return "You are already registered.";
    };

    // If not, create a new profile and save it
    let newUserProfile : UserProfile = {
      principal = callerPrincipal;
      firstRegistered = Time.now();
    };

    Map.set(userRegistry, phash, callerPrincipal, newUserProfile);

    return "Success! Your Principal has been registered in the backend.";
  };

  /**
     * A simple query function to get the profile of the calling user.
     */
  public shared query (msg) func getMyProfile() : async ?UserProfile {
    return Map.get(userRegistry, phash, msg.caller);
  };

  /**
   * Returns a greeting for the given name.
   */
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  }
};
