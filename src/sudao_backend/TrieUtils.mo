// src/sudao_backend/TrieUtils.mo
// Utility functions for working with Trie data structures

import Trie "mo:base/Trie";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";

module {
    
    // Type aliases for better readability
    public type Key<K> = Trie.Key<K>;
    
    // Helper functions to create keys for common types
    public func natKey(n : Nat) : Key<Nat> = { 
        hash = Nat32.fromNat(n % (2**32 - 1)); // Better hash for large Nat values
        key = n 
    };
    
    public func principalKey(p : Principal) : Key<Principal> = { 
        hash = Principal.hash(p); 
        key = p 
    };
    
    public func textKey(t : Text) : Key<Text> = { 
        hash = Text.hash(t); 
        key = t 
    };
    
    // Convenience functions for common Trie operations
    public func getNat<V>(trie : Trie.Trie<Nat, V>, key : Nat) : ?V {
        Trie.get(trie, natKey(key), func(a: Nat, b: Nat) : Bool = a == b)
    };
    
    public func putNat<V>(trie : Trie.Trie<Nat, V>, key : Nat, value : V) : Trie.Trie<Nat, V> {
        Trie.put(trie, natKey(key), func(a: Nat, b: Nat) : Bool = a == b, value).0
    };
    
    public func getPrincipal<V>(trie : Trie.Trie<Principal, V>, key : Principal) : ?V {
        Trie.get(trie, principalKey(key), Principal.equal)
    };
    
    public func putPrincipal<V>(trie : Trie.Trie<Principal, V>, key : Principal, value : V) : Trie.Trie<Principal, V> {
        Trie.put(trie, principalKey(key), Principal.equal, value).0
    };
} 