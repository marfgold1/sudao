import {ic} "mo:ic";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";

module {
    public func getControllers(canisterId: Principal) : async [Principal] {
        let status = await ic.canister_status({
            canister_id = canisterId;
        });
        status.settings.controllers.vals() |> Iter.toArray(_)
    };

    public func isController(caller : Principal, controllers : [Principal]) : async Bool {
        var isController = false;
        label check for (controller in controllers.vals()) {
            if (controller == caller) {
                isController := true;
                break check;
            };
        };
        
        isController
    };
};