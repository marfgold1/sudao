import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Int "mo:base/Int";

module {
  // Utility functions for validation and formatting

  public func isValidPrincipal(principal : Principal) : Bool {
    // Check if principal is not anonymous
    Principal.notEqual(principal, Principal.fromText("2vxsx-fae"));
  };

  public func formatTimestamp(timestamp : Time.Time) : Text {
    // Simple timestamp formatting (in a real app, you'd use a proper date library)
    Int.toText(timestamp);
  };

  public func logInfo(message : Text) : () {
    Debug.print("[INFO] " # message);
  };

  public func logError(message : Text) : () {
    Debug.print("[ERROR] " # message);
  };

  public func createSuccessMessage(action : Text) : Text {
    "Success! " # action # " completed successfully.";
  };

  public func createErrorMessage(action : Text, reason : Text) : Text {
    "Error during " # action # ": " # reason;
  };
};
