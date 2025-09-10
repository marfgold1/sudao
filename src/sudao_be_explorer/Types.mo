import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat8 "mo:base/Nat8";
import Array "mo:base/Array";
import Map "mo:map/Map";
import List "mo:base/List";
import Utils "../common/Utils";

module {
    public type WasmCodeMap = Map.Map<Nat8, WasmInfo>;
    public type CodeCanisterList = List.List<(WasmCodeType, Principal)>;
    public type WasmInfo = {
        code : Blob;
        version : Text;
        uploadedAt : Time.Time;
        uploadedBy : Principal;
    };

    public type WasmCodeType = {
        #backend;
        #ledger;
        #swap;
    };

    public let wasmCodeTypes : [WasmCodeType] = [
        #backend,
        #ledger,
        #swap,
    ];

    public func getWasmCodeKey(codeType : WasmCodeType) : Nat8 {
        switch (Array.indexOf<WasmCodeType>(codeType, wasmCodeTypes, func (a, b) = a == b)) {
            case (?i) Nat8.fromNat(i);
            case null 0; // fallback, should not happen
        }
    };

    public func getCodePrincipal(codeCanisterList : CodeCanisterList, codeType : WasmCodeType) : Principal {
        switch (List.find<(WasmCodeType, Principal)>(codeCanisterList, func((codeType_, _)) = codeType_ == codeType)) {
            case (?(_, canisterId)) canisterId;
            case null Utils.getAnonymous();
        };
    };

    public func wasmCodeTypeToText(codeType : WasmCodeType) : Text {
        switch (codeType) {
            case (#backend) "backend";
            case (#ledger) "ledger"; 
            case (#swap) "swap";
        }
    };
};
