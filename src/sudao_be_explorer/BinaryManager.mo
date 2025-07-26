import Result "mo:base/Result";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Map "mo:map/Map";
import { n8hash } "mo:map/Map";
import Principal "mo:base/Principal";
import Types "Types";

module {
    public type SetWasmInfoRequest = {
        codeType : Types.WasmCodeType;
        code : Blob;
        version : Text;
        uploader : Principal;
    };

    /**
    * Set WASM code for DAO deployments
    */
    public func setWasmCode(
        codeMap : Types.WasmCodeMap, 
        request : SetWasmInfoRequest,
    ) : Result.Result<(), Text> {
        if (request.code.size() == 0) {
            return #err("WASM code cannot be empty");
        };
        Map.set(codeMap, n8hash, Types.getWasmCodeKey(request.codeType), {
            code = request.code;
            version = request.version;
            uploadedAt = Time.now();
            uploadedBy = request.uploader;
        });
        
        #ok
    };

    /**
    * Check if WASM code is available for deployment
    */
    public func hasWasmCode(codeMap : Types.WasmCodeMap, key : Types.WasmCodeType) : Bool {
        switch (Map.get(codeMap, n8hash, Types.getWasmCodeKey(key))) {
            case (?info) info.code.size() > 0;
            case null false;
        }
    };

    /**
    * Get WASM info
    */
    public func getWasmInfo(codeMap : Types.WasmCodeMap, key : Types.WasmCodeType) : ?Types.WasmInfo {
        Map.get(codeMap, n8hash, Types.getWasmCodeKey(key))
    };

    /**
    * Get WASM code
    */
    public func getWasmCode(codeMap : Types.WasmCodeMap, key : Types.WasmCodeType) : ?Blob {
        switch (Map.get(codeMap, n8hash, Types.getWasmCodeKey(key))) {
            case (?info) ?info.code;
            case null null;
        }
    };
}