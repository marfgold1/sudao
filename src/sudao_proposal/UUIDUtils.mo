// UUID v4 generation using Internet Computer's randomness
import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Text "mo:base/Text";
import Char "mo:base/Char";
import Array "mo:base/Array";

module {
    // Generate a UUID v4 using IC randomness
    public func generateUUIDv4() : async Text {
        // Get 16 random bytes from IC
        let randomBlob = await Random.blob();
        let randomBytes = Blob.toArray(randomBlob);
        
        // Ensure we have enough bytes, if not, pad with deterministic values
        let bytes = if (randomBytes.size() >= 16) {
            Array.tabulate<Nat8>(16, func(i) = randomBytes[i % randomBytes.size()])
        } else {
            Array.tabulate<Nat8>(16, func(i) = 
                if (i < randomBytes.size()) randomBytes[i] 
                else Nat8.fromNat(i * 37 % 256) // Simple fallback
            )
        };
        
        // Set version (4) and variant bits according to RFC 4122
        let versionedBytes = Array.tabulate<Nat8>(16, func(i) {
            if (i == 6) {
                (bytes[i] & 0x0f) | 0x40 // Version 4
            } else if (i == 8) {
                (bytes[i] & 0x3f) | 0x80 // Variant bits
            } else {
                bytes[i]
            }
        });
        
        // Format as UUID string: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        let hex = Array.map<Nat8, Text>(versionedBytes, func(b) = nat8ToHex(b));
        
        hex[0] # hex[1] # hex[2] # hex[3] # "-" #
        hex[4] # hex[5] # "-" #
        hex[6] # hex[7] # "-" #
        hex[8] # hex[9] # "-" #
        hex[10] # hex[11] # hex[12] # hex[13] # hex[14] # hex[15]
    };
    
    // Convert Nat8 to 2-character hex string
    private func nat8ToHex(n : Nat8) : Text {
        let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
        let high = Nat8.toNat(n / 16);
        let low = Nat8.toNat(n % 16);
        Text.fromChar(chars[high]) # Text.fromChar(chars[low])
    };
    
    // Validate if a string is a valid UUID format
    public func isValidUUID(uuid : Text) : Bool {
        if (Text.size(uuid) != 36) return false;
        
        let chars = Text.toArray(uuid);
        for (i in chars.keys()) {
            let c = chars[i];
            switch (i) {
                case (8 or 13 or 18 or 23) {
                    if (c != '-') return false;
                };
                case (_) {
                    if (not isHexChar(c)) return false;
                };
            }
        };
        true
    };
    
    // Check if character is valid hex
    private func isHexChar(c : Char) : Bool {
        (c >= '0' and c <= '9') or 
        (c >= 'a' and c <= 'f') or 
        (c >= 'A' and c <= 'F')
    };
    
    // Generate a simple hash for UUID (for Map usage)
    public func uuidHash(uuid : Text) : Nat32 {
        Text.hash(uuid)
    };
};