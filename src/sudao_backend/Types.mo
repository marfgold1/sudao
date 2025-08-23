import Principal "mo:base/Principal";
import Time "mo:base/Time";

module {
  // DAO-related types
  public type DAOInfo = {
    name : Text;
    description : Text;
    tags : [Text];
    creator : Principal;
    createdAt : Time.Time;
  };

  // User-related types
  public type UserProfile = {
    principal : Principal;
    firstRegistered : Time.Time;
  };

  // Response types
  public type RegistrationResult = {
    #Success : Text;
    #AlreadyRegistered : Text;
    #Error : Text;
  };

  public type ProfileResult = {
    #Found : UserProfile;
    #NotFound : Text;
  };

  // System types
  public type BaseSystemInfo = {
    totalUsers : Nat;
    systemStartTime : Time.Time;
  };

  public type SystemInfo = {
    totalUsers : Nat;
    systemStartTime : Time.Time;
    daoInfo : ?DAOInfo;
  };
};
