module synapse::memory_reputation {
    use synapse::memory_store;
    use synapse::memory_registry;

    /// Error codes
    const E_MEMORY_NOT_FOUND: u64 = 1;
    const E_AGENT_NOT_REGISTERED: u64 = 2;

    /// Reputation deltas
    const SUCCESS_SCORE_INCREASE: u64 = 5;
    const FAILURE_SCORE_DECREASE: u64 = 3;
    const SUCCESS_REPUTATION_INCREASE: u64 = 5;

    /// ORIGINAL ReputationStore struct - MUST KEEP
    struct ReputationStore has key {
        dummy: bool,
    }

    /// ORIGINAL init function - EXACT SAME
    public entry fun init(user: &signer) {
        move_to(user, ReputationStore {
            dummy: true
        });
    }

    /// ORIGINAL update_reputation function - EXACT SAME SIGNATURE
    public entry fun update_reputation(
        _user: &signer,
        _memory_id: u64,
        _delta: u64,
    ) {
        // Keep original no-op for backward compatibility
    }

    /// NEW function: Apply task result and update both memory and agent reputation
    public entry fun apply_task_result(
        _caller: &signer,
        memory_id: u64,
        is_success: bool
    ) {
        let (memory_exists, owner, current_score, success_count, failure_count) = 
            memory_store::get_memory(memory_id);
        
        assert!(memory_exists, E_MEMORY_NOT_FOUND);

        let (agent_registered, _, _) = 
            memory_registry::get_agent_stats(owner);
        
        assert!(agent_registered, E_AGENT_NOT_REGISTERED);

        let new_score: u64;
        let new_success_count: u64;
        let new_failure_count: u64;
        let reputation_delta: u64;

        if (is_success) {
            new_score = current_score + SUCCESS_SCORE_INCREASE;
            new_success_count = success_count + 1;
            new_failure_count = failure_count;
            reputation_delta = SUCCESS_REPUTATION_INCREASE;
        } else {
            if (current_score >= FAILURE_SCORE_DECREASE) {
                new_score = current_score - FAILURE_SCORE_DECREASE;
            } else {
                new_score = 0;
            };
            new_success_count = success_count;
            new_failure_count = failure_count + 1;
            reputation_delta = 0;
        };

        memory_store::update_memory_stats(
            memory_id,
            new_score,
            new_success_count,
            new_failure_count
        );

        memory_registry::update_agent_stats(
            owner,
            reputation_delta,
            1
        );
    }

    #[view]
    public fun calculate_expected_score(current_score: u64, is_success: bool): u64 {
        if (is_success) {
            current_score + SUCCESS_SCORE_INCREASE
        } else {
            if (current_score >= FAILURE_SCORE_DECREASE) {
                current_score - FAILURE_SCORE_DECREASE
            } else {
                0
            }
        }
    }
}
