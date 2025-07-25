import Types "Types";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Blob "mo:base/Blob";

module {
    public class BinaryManager() {
        // WASM code management
        private var wasmInfo : ?Types.WasmInfo = null;

        /**
         * Set WASM code for DAO deployments
         */
        public func setWasmCode(code : Blob, version : Text, uploader : Principal) : Result.Result<(), Text> {
            if (code.size() == 0) {
                return #err("WASM code cannot be empty");
            };
            
            wasmInfo := ?{
                code = code;
                version = version;
                uploadedAt = Time.now();
                uploadedBy = uploader;
            };
            
            #ok(())
        };

        /**
         * Check if WASM code is available for deployment
         */
        public func hasWasmCode() : Bool {
            switch (wasmInfo) {
                case (?info) info.code.size() > 0;
                case null false;
            }
        };

        /**
         * Get WASM info (stripped code)
         */
        public func getWasmInfo() : ?Types.WasmInfo {
            switch (wasmInfo) {
                case (?info) ?{
                    code = "": Blob;
                    uploadedAt = info.uploadedAt;
                    uploadedBy = info.uploadedBy;
                    version = info.version;
                };
                case null null;
            }
        };

        /**
         * Get WASM code
         */
        public func getWasmCode() : ?Blob {
            switch (wasmInfo) {
                case (?info) ?info.code;
                case null null;
            }
        };

        /**
         * STABLE ONLY: Get WASM info
         */
        public func stableGet() : ?Types.WasmInfo {
            switch (wasmInfo) {
                case (?info) ?info;
                case null null;
            }
        };

        /**
         * STABLE ONLY: Set WASM info
         */
        public func stableSet(info : ?Types.WasmInfo) {
            wasmInfo := info;
        };
    }
}