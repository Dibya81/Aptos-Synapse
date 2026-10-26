module synapse::memory_store {
    use std::signer;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_MEMORY_NOT_FOUND: u64 = 3;

    /// Memory proof structure
    struct Memory has store, copy, drop {
        memory_id: u64,
        owner: address,
        hash: vector<u8>,
        score: u64,
        success_count: u64,
        failure_count: u64,
    }

    // Events
    #[event]
    struct MemoryCreatedEvent has drop, store {
        memory_id: u64,
        owner: address,
        hash: vector<u8>,
    }

    #[event]
    struct MemoryUpdatedEvent has drop, store {
        memory_id: u64,
        new_score: u64,
        success_count: u64,
        failure_count: u64,
    }

    /// ORIGINAL MemoryStore struct - MUST NOT CHANGE
    struct MemoryStore has key {
        dummy: bool,
    }

    /// NEW struct for actual memory data
    struct MemoryData has key {
        memories: Table<u64, Memory>,
        next_memory_id: u64,
    }

    /// ORIGINAL init function - EXACT SAME
    public entry fun init(account: &signer) {
        move_to(account, MemoryStore {
            dummy: true
        });
    }

    /// Initialize the memory data store
    public entry fun init_memory_data(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<MemoryData>(account_addr), E_ALREADY_INITIALIZED);

        move_to(account, MemoryData {
            memories: table::new(),
            next_memory_id: 1,
        });
    }

    /// Alias for init
    public entry fun init_store(account: &signer) {
        init(account);
    }

    /// ORIGINAL create_memory - EXACT SAME SIGNATURE
    public entry fun create_memory(
        _creator: &signer,
        _content_hash: vector<u8>,
        _embedding_hash: vector<u8>,
    ) {
        // Keep original empty implementation for backward compatibility
    }

    /// NEW create_memory_v2 with actual implementation
    public entry fun create_memory_v2(
        creator: &signer,
        content_hash: vector<u8>,
    ) acquires MemoryData {
        let owner = signer::address_of(creator);
        let store_addr = @synapse;
        
        assert!(exists<MemoryData>(store_addr), E_NOT_INITIALIZED);

        let data = borrow_global_mut<MemoryData>(store_addr);
        let memory_id = data.next_memory_id;
        data.next_memory_id = data.next_memory_id + 1;

        let memory = Memory {
            memory_id,
            owner,
            hash: content_hash,
            score: 0,
            success_count: 0,
            failure_count: 0,
        };

        table::add(&mut data.memories, memory_id, memory);

        event::emit(MemoryCreatedEvent {
            memory_id,
            owner,
            hash: content_hash,
        });
    }

    /// Create memory and return ID (non-entry version)
    public fun create_memory_internal(account: &signer, hash: vector<u8>): u64 acquires MemoryData {
        let owner = signer::address_of(account);
        let store_addr = @synapse;
        
        assert!(exists<MemoryData>(store_addr), E_NOT_INITIALIZED);

        let data = borrow_global_mut<MemoryData>(store_addr);
        let memory_id = data.next_memory_id;
        data.next_memory_id = data.next_memory_id + 1;

        let memory = Memory {
            memory_id,
            owner,
            hash,
            score: 0,
            success_count: 0,
            failure_count: 0,
        };

        table::add(&mut data.memories, memory_id, memory);

        event::emit(MemoryCreatedEvent {
            memory_id,
            owner,
            hash,
        });

        memory_id
    }

    /// Update memory statistics
    public fun update_memory_stats(
        memory_id: u64,
        new_score: u64,
        success_count: u64,
        failure_count: u64
    ) acquires MemoryData {
        let store_addr = @synapse;
        assert!(exists<MemoryData>(store_addr), E_NOT_INITIALIZED);

        let data = borrow_global_mut<MemoryData>(store_addr);
        assert!(table::contains(&data.memories, memory_id), E_MEMORY_NOT_FOUND);

        let memory = table::borrow_mut(&mut data.memories, memory_id);
        memory.score = new_score;
        memory.success_count = success_count;
        memory.failure_count = failure_count;

        event::emit(MemoryUpdatedEvent {
            memory_id,
            new_score,
            success_count,
            failure_count,
        });
    }

    /// Get memory details (returns: exists, owner, score, success_count, failure_count)
    public fun get_memory(memory_id: u64): (bool, address, u64, u64, u64) acquires MemoryData {
        let store_addr = @synapse;
        
        if (!exists<MemoryData>(store_addr)) {
            return (false, @0x0, 0, 0, 0)
        };

        let data = borrow_global<MemoryData>(store_addr);
        
        if (!table::contains(&data.memories, memory_id)) {
            return (false, @0x0, 0, 0, 0)
        };

        let memory = table::borrow(&data.memories, memory_id);
        (true, memory.owner, memory.score, memory.success_count, memory.failure_count)
    }

    #[view]
    public fun memory_exists(memory_id: u64): bool acquires MemoryData {
        let (exists, _, _, _, _) = get_memory(memory_id);
        exists
    }

    // Add at the end, before the closing brace

#[view]
public fun view_memory_score(memory_id: u64): u64 acquires MemoryData {
    let store_addr = @synapse;
    
    if (!exists<MemoryData>(store_addr)) {
        return 0
    };

    let data = borrow_global<MemoryData>(store_addr);
    
    if (!table::contains(&data.memories, memory_id)) {
        return 0
    };

    let memory = table::borrow(&data.memories, memory_id);
    memory.score
}

#[view]
public fun view_memory_exists(memory_id: u64): bool acquires MemoryData {
    let store_addr = @synapse;
    
    if (!exists<MemoryData>(store_addr)) {
        return false
    };

    let data = borrow_global<MemoryData>(store_addr);
    table::contains(&data.memories, memory_id)
}

#[view]
public fun view_memory_details(memory_id: u64): (bool, u64, u64, u64) acquires MemoryData {
    let store_addr = @synapse;
    
    if (!exists<MemoryData>(store_addr)) {
        return (false, 0, 0, 0)
    };

    let data = borrow_global<MemoryData>(store_addr);
    
    if (!table::contains(&data.memories, memory_id)) {
        return (false, 0, 0, 0)
    };

    let memory = table::borrow(&data.memories, memory_id);
    (true, memory.score, memory.success_count, memory.failure_count)
}
}