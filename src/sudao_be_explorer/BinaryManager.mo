import Result "mo:base/Result";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Map "mo:map/Map";
import { n8hash; thash; nhash } "mo:map/Map";
import Principal "mo:base/Principal";
import Types "Types";

module {
    public type SetWasmInfoRequest = {
        codeType : Types.WasmCodeType;
        code : Blob;
        version : Text;
        uploader : Principal;
    };

    public type ChunkUploadRequest = {
        codeType : Types.WasmCodeType;
        chunk : Blob;
        chunkIndex : Nat;
        totalChunks : Nat;
        version : Text;
        uploader : Principal;
    };

    // Track chunked upload progress
    public type ChunkUploadState = {
        var chunks : Map.Map<Nat, Blob>; // chunk index -> chunk data
        var totalChunks : Nat;
        var receivedChunks : Nat;
        version : Text;
        uploader : Principal;
        startedAt : Time.Time;
    };

    public type ChunkUploadMap = Map.Map<Text, ChunkUploadState>; // codeType -> upload state

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

    /**
    * Upload WASM code chunk
    */
    public func uploadWasmChunk(
        codeMap : Types.WasmCodeMap,
        chunkMap : ChunkUploadMap,
        request : ChunkUploadRequest,
    ) : Result.Result<Text, Text> {
        if (request.chunk.size() == 0) {
            return #err("Chunk cannot be empty");
        };

        let wasmKey = Types.getWasmCodeKey(request.codeType);
        let uploadKey = Types.wasmCodeTypeToText(request.codeType); // Use string key for chunk map
        
        // Get or create upload state
        let uploadState = switch (Map.get(chunkMap, thash, uploadKey)) {
            case (?state) {
                // Verify consistency
                if (state.totalChunks != request.totalChunks) {
                    return #err("Total chunks mismatch");
                };
                if (state.version != request.version) {
                    return #err("Version mismatch");
                };
                state
            };
            case null {
                let state = {
                    var chunks = Map.new<Nat, Blob>();
                    var totalChunks = request.totalChunks;
                    var receivedChunks = 0;
                    version = request.version;
                    uploader = request.uploader;
                    startedAt = Time.now();
                };
                Map.set(chunkMap, thash, uploadKey, state);
                state
            };
        };

        // Check if chunk already received
        if (Map.has(uploadState.chunks, nhash, request.chunkIndex)) {
            return #err("Chunk already received");
        };

        // Store chunk
        Map.set(uploadState.chunks, nhash, request.chunkIndex, request.chunk);
        uploadState.receivedChunks += 1;

        // Check if upload is complete
        if (uploadState.receivedChunks == uploadState.totalChunks) {
            // Reconstruct complete WASM in correct order by iterating through chunk indices sequentially
            var chunksArray : [Blob] = [];
            for (i in Iter.range(0, uploadState.totalChunks - 1)) {
                switch (Map.get(uploadState.chunks, nhash, i)) {
                    case (?chunk) {
                        chunksArray := Array.append(chunksArray, [chunk]);
                    };
                    case null {
                        return #err("Missing chunk: " # Nat.toText(i));
                    };
                };
            };
            
            // Convert chunks to bytes and concatenate
            var completeBytes : [Nat8] = [];
            for (chunk in chunksArray.vals()) {
                completeBytes := Array.append(completeBytes, Blob.toArray(chunk));
            };

            // Create final blob
            let completeWasm = Blob.fromArray(completeBytes);
            
            // Store in code map
            Map.set(codeMap, n8hash, wasmKey, {
                code = completeWasm;
                version = uploadState.version;
                uploadedAt = Time.now();
                uploadedBy = uploadState.uploader;
            });

            // Clean up chunk data
            Map.delete(chunkMap, thash, uploadKey);
            
            return #ok("Upload complete");
        };

        #ok("Chunk " # Nat.toText(request.chunkIndex + 1) # "/" # Nat.toText(request.totalChunks) # " received")
    };

    /**
    * Get chunk upload status
    */
    public func getChunkUploadStatus(chunkMap : ChunkUploadMap, codeType : Types.WasmCodeType) : ?{receivedChunks : Nat; totalChunks : Nat} {
        let uploadKey = Types.wasmCodeTypeToText(codeType); // Use string key for chunk map
        switch (Map.get(chunkMap, thash, uploadKey)) {
            case (?state) ?{receivedChunks = state.receivedChunks; totalChunks = state.totalChunks};
            case null null;
        }
    };
}