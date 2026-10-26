module synapse::memory_registry {
    use std::signer;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_AGENT_NOT_REGISTERED: u64 = 3;
    const E_AGENT_ALREADY_REGISTERED: u64 = 4;
    const E_AGENT_STORE_NOT_INITIALIZED: u64 = 5;

    /// Agent stats structure
    struct AgentStats has store, copy, drop {
        is_registered: bool,
        reputation: u64,
        total_tasks: u64,
    }

    /// Original Registry - MUST NOT CHANGE THIS STRUCT
    struct Registry has key, store {
        total: u64,
    }

    /// NEW separate struct for agent data
    struct AgentStore has key {
        agents: Table<address, AgentStats>,
    }

    /// Original init function - EXACT SAME AS BEFORE
    public entry fun init(admin: &signer) {
        move_to(admin, Registry { total: 0 });
    }

    /// Original get_total function - EXACT SAME AS BEFORE
    public fun get_total(addr: address): u64 acquires Registry {
        borrow_global<Registry>(addr).total
    }

    /// Initialize the agent store (call this AFTER init if not already done)
    public entry fun init_agent_store(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<AgentStore>(admin_addr), E_ALREADY_INITIALIZED);
        
        move_to(admin, AgentStore {
            agents: table::new(),
        });
    }

    /// Alias for init
    public entry fun init_registry(account: &signer) {
        init(account);
    }

    /// Register a new agent
    public entry fun register_agent(account: &signer) acquires Registry, AgentStore {
        let agent_addr = signer::address_of(account);
        let registry_addr = @synapse;
        
        assert!(exists<Registry>(registry_addr), E_NOT_INITIALIZED);
        assert!(exists<AgentStore>(registry_addr), E_AGENT_STORE_NOT_INITIALIZED);
        
        let agent_store = borrow_global_mut<AgentStore>(registry_addr);
        assert!(!table::contains(&agent_store.agents, agent_addr), E_AGENT_ALREADY_REGISTERED);

        let stats = AgentStats {
            is_registered: true,
            reputation: 0,
            total_tasks: 0,
        };

        table::add(&mut agent_store.agents, agent_addr, stats);
        
        // Update the original total counter
        let registry = borrow_global_mut<Registry>(registry_addr);
        registry.total = registry.total + 1;
    }

    /// Update agent statistics
    public fun update_agent_stats(
        agent_addr: address,
        reputation_delta: u64,
        tasks_delta: u64
    ) acquires AgentStore {
        let registry_addr = @synapse;
        assert!(exists<AgentStore>(registry_addr), E_AGENT_STORE_NOT_INITIALIZED);

        let agent_store = borrow_global_mut<AgentStore>(registry_addr);
        assert!(table::contains(&agent_store.agents, agent_addr), E_AGENT_NOT_REGISTERED);

        let stats = table::borrow_mut(&mut agent_store.agents, agent_addr);
        stats.reputation = stats.reputation + reputation_delta;
        stats.total_tasks = stats.total_tasks + tasks_delta;
    }

    /// Get agent statistics (returns: is_registered, reputation, total_tasks)
    public fun get_agent_stats(agent_addr: address): (bool, u64, u64) acquires AgentStore {
        let registry_addr = @synapse;
        
        if (!exists<AgentStore>(registry_addr)) {
            return (false, 0, 0)
        };

        let agent_store = borrow_global<AgentStore>(registry_addr);
        
        if (!table::contains(&agent_store.agents, agent_addr)) {
            return (false, 0, 0)
        };

        let stats = table::borrow(&agent_store.agents, agent_addr);
        (stats.is_registered, stats.reputation, stats.total_tasks)
    }

    #[view]
    public fun is_agent_registered(agent_addr: address): bool acquires AgentStore {
        let (is_registered, _, _) = get_agent_stats(agent_addr);
        is_registered
    }

    #[view]
    public fun get_reputation(agent_addr: address): u64 acquires AgentStore {
        let (_, reputation, _) = get_agent_stats(agent_addr);
        reputation
    }

    #[view]
    public fun get_total_tasks(agent_addr: address): u64 acquires AgentStore {
        let (_, _, total_tasks) = get_agent_stats(agent_addr);
        total_tasks
    }

    // Add at the end, before the closing brace

#[view]
public fun view_agent_reputation(agent_addr: address): u64 acquires AgentStore {
    let registry_addr = @synapse;
    
    if (!exists<AgentStore>(registry_addr)) {
        return 0
    };

    let agent_store = borrow_global<AgentStore>(registry_addr);
    
    if (!table::contains(&agent_store.agents, agent_addr)) {
        return 0
    };

    let stats = table::borrow(&agent_store.agents, agent_addr);
    stats.reputation
}

#[view]
public fun view_agent_tasks(agent_addr: address): u64 acquires AgentStore {
    let registry_addr = @synapse;
    
    if (!exists<AgentStore>(registry_addr)) {
        return 0
    };

    let agent_store = borrow_global<AgentStore>(registry_addr);
    
    if (!table::contains(&agent_store.agents, agent_addr)) {
        return 0
    };

    let stats = table::borrow(&agent_store.agents, agent_addr);
    stats.total_tasks
}
}