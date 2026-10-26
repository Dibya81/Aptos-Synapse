#[test_only]
module synapse::contract_tests {
    use std::signer;
    use synapse::memory_store;
    use synapse::memory_registry;
    use synapse::memory_reputation;
    use aptos_framework::account;

    #[test(synapse_account = @synapse, user = @0x123)]
    fun test_memory_lifecycle(synapse_account: &signer, user: &signer) {
        account::create_account_for_test(signer::address_of(synapse_account));
        account::create_account_for_test(signer::address_of(user));

        // 1. Initialize store
        memory_store::init_memory_data(synapse_account);

        // 2. Create memory proof
        let hash = x"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        memory_store::create_memory_v2(user, hash);

        // 3. Verify memory existence
        assert!(memory_store::view_memory_exists(1), 101);
        let (exists, score, success_count, failure_count) = memory_store::view_memory_details(1);
        assert!(exists, 102);
        assert!(score == 0, 103);
        assert!(success_count == 0, 104);
        assert!(failure_count == 0, 105);
    }

    #[test(synapse_account = @synapse, agent = @0x456)]
    fun test_agent_registration(synapse_account: &signer, agent: &signer) {
        account::create_account_for_test(signer::address_of(synapse_account));
        account::create_account_for_test(signer::address_of(agent));

        memory_registry::init(synapse_account);
        memory_registry::init_agent_store(synapse_account);

        memory_registry::register_agent(agent);

        let agent_addr = signer::address_of(agent);
        assert!(memory_registry::is_agent_registered(agent_addr), 201);
        assert!(memory_registry::view_agent_reputation(agent_addr) == 0, 202);
        assert!(memory_registry::view_agent_tasks(agent_addr) == 0, 203);
    }

    #[test]
    fun test_expected_score_calculation() {
        let success_score = memory_reputation::calculate_expected_score(10, true);
        assert!(success_score == 15, 301);

        let failure_score = memory_reputation::calculate_expected_score(10, false);
        assert!(failure_score == 7, 302);

        let bounded_failure = memory_reputation::calculate_expected_score(2, false);
        assert!(bounded_failure == 0, 303);
    }
}
