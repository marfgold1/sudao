import Principal "mo:base/Principal";
import Result "mo:base/Result";
import ProposalTypes "Types";

module {
    // Interface for DAO canisters to interact with the proposal canister
    public type ProposalCanisterInterface = actor {
        // DAO registration
        registerDAO : (
            daoId : Text,
            ledgerCanisterId : Principal,
            ammCanisterId : Principal,
            daoCanisterId : Principal
        ) -> async Result.Result<Bool, Text>;
        
        // Core proposal operations
        createDraftProposal : (
            daoId : Text,
            title : Text,
            description : Text,
            proposalType : ProposalTypes.ProposalType,
            beneficiaryAddress : ?Principal,
            requestedAmount : ?Nat,
            votingDurationSeconds : Nat,
            minimumParticipation : Nat,
            minimumApproval : Nat,
        ) -> async Result.Result<Text, ProposalTypes.ProposalError>;
        
        publishProposal : (daoId : Text, proposalId : Text) -> async Result.Result<Bool, ProposalTypes.ProposalError>;
        
        voteOnProposal : (
            daoId : Text,
            proposalId : Text,
            choice : ProposalTypes.Vote
        ) -> async Result.Result<Bool, ProposalTypes.ProposalError>;
        
        finalizeProposal : (daoId : Text, proposalId : Text) -> async Result.Result<ProposalTypes.ProposalStatus, ProposalTypes.ProposalError>;
        
        executeProposal : (daoId : Text, proposalId : Text) -> async Result.Result<Bool, ProposalTypes.ProposalError>;
        
        addComment : (daoId : Text, proposalId : Text, content : Text) -> async Result.Result<Text, ProposalTypes.ProposalError>;
        
        // Query operations
        getProposal : query (daoId : Text, proposalId : Text) -> async ?ProposalTypes.Proposal;
        
        listProposals : query (daoId : Text) -> async [ProposalTypes.Proposal];
        
        listProposalsByStatus : query (
            daoId : Text,
            status : ?ProposalTypes.ProposalStatus
        ) -> async [ProposalTypes.Proposal];
        
        getProposalCount : query (daoId : Text) -> async Nat;
        
        getDAOInfo : query (daoId : Text) -> async ?ProposalTypes.DAORegistration;
    };

    // Interface for ICRC1 ledger operations
    public type ICRC1LedgerInterface = actor {
        icrc1_balance_of : shared query ({ owner : Principal; subaccount : ?[Nat8] }) -> async Nat;
        icrc1_total_supply : shared query () -> async Nat;
    };
};