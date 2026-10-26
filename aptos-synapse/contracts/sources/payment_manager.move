module synapse::payment_manager {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use std::vector;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;
    const E_INVALID_RECIPIENTS: u64 = 5;

    /// Payment record
    struct Payment has store, copy, drop {
        task_id: u64,
        payer: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    /// Payment store
    struct PaymentStore has key {
        total_payments: u64,
        orchestrator: address,
    }

    // Events
    #[event]
    struct PaymentSentEvent has drop, store {
        task_id: u64,
        payer: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    #[event]
    struct BatchPaymentEvent has drop, store {
        task_id: u64,
        payer: address,
        recipients: vector<address>,
        amounts: vector<u64>,
        total_amount: u64,
        timestamp: u64,
    }

    /// Initialize payment manager
    public entry fun init(account: &signer) {
        let account_addr = signer::address_of(account);
        
        move_to(account, PaymentStore {
            total_payments: 0,
            orchestrator: account_addr,
        });
    }

    /// Pay agent for task completion
    public entry fun pay_agent(
        payer: &signer,
        recipient: address,
        amount: u64,
        task_id: u64
    ) acquires PaymentStore {
        let payer_addr = signer::address_of(payer);
        let store_addr = @synapse;
        
        assert!(exists<PaymentStore>(store_addr), E_NOT_INITIALIZED);
        
        // Transfer coins
        coin::transfer<AptosCoin>(payer, recipient, amount);
        
        // Update records
        let store = borrow_global_mut<PaymentStore>(store_addr);
        store.total_payments = store.total_payments + 1;
        
        // Emit event
        event::emit(PaymentSentEvent {
            task_id,
            payer: payer_addr,
            recipient,
            amount,
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    /// Pay multiple agents (batch payment)
    public entry fun pay_agents_batch(
        payer: &signer,
        recipients: vector<address>,
        amounts: vector<u64>,
        task_id: u64
    ) acquires PaymentStore {
        let payer_addr = signer::address_of(payer);
        let store_addr = @synapse;
        
        assert!(exists<PaymentStore>(store_addr), E_NOT_INITIALIZED);
        assert!(vector::length(&recipients) == vector::length(&amounts), E_INVALID_RECIPIENTS);
        
        let total_amount: u64 = 0;
        let i: u64 = 0;
        let len = vector::length(&recipients);
        
        // Pay each recipient
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            
            coin::transfer<AptosCoin>(payer, recipient, amount);
            total_amount = total_amount + amount;
            
            i = i + 1;
        };
        
        // Update records
        let store = borrow_global_mut<PaymentStore>(store_addr);
        store.total_payments = store.total_payments + len;
        
        // Emit batch event
        event::emit(BatchPaymentEvent {
            task_id,
            payer: payer_addr,
            recipients,
            amounts,
            total_amount,
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    // Get total payments
    #[view]
    public fun get_total_payments(): u64 acquires PaymentStore {
        let store_addr = @synapse;
        
        if (!exists<PaymentStore>(store_addr)) {
            return 0
        };
        
        let store = borrow_global<PaymentStore>(store_addr);
        store.total_payments
    }
}