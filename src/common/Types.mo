import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {
    // Shared types
    public type DAOEntry = {
        id : Text;
        name : Text;
        description : Text;
        tags : [Text];
        createdAt : Time.Time;
        creator : Principal;
    };
}
