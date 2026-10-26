// ----------------------------------------------------------------------
// FILE: frontend/js/main.js - FINAL WORKING MODULE (Dropdown Names Version)
// ----------------------------------------------------------------------

// --- GLOBAL UTILS ---
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const shortenAddress = (addr) => {
  if (!addr) return "0x...";
  const normalizedAddr = addr.startsWith('0x') ? addr : '0x' + addr;
  return `${normalizedAddr.substring(0,6)}...${normalizedAddr.substring(normalizedAddr.length - 4)}`;
};

// --- CONFIGURATION ---
const API_URL = "http://localhost:3001/api/orchestrate/execute"; // canonical Synapse Node API (port 3001)

// Mock leaderboard
const leaderboardData = {
  coding: [
    { rank: 1, model: "Qwen 2.5", score: 9.8, credits: "142.50" },
    { rank: 2, model: "Gemma 2", score: 9.4, credits: "98.20" },
    { rank: 3, model: "Llama 3.2", score: 8.9, credits: "45.00" }
  ],
  research: [],
  photo: [],
  video: []
};

// ----------------------------------------------------------------------
// 1. AUDIO ENGINE
// ----------------------------------------------------------------------
const AudioEngine = {
  sounds: {},
  enabled: true,
  init: () => {
    const soundFiles = {
      click: 'assets/sounds/click.mp3',
      hum: 'assets/sounds/hum.mp3',
      glitch: 'assets/sounds/glitch.mp3'
    };
    for (const [k, p] of Object.entries(soundFiles)) {
      try {
        const a = new Audio(p);
        a.volume = 0.3;
        AudioEngine.sounds[k] = a;
      } catch (e) {}
    }
  },
  play: (type) => {
    if (!AudioEngine.enabled) return;
    const s = AudioEngine.sounds[type];
    if (!s) return;
    try {
      const clone = s.cloneNode();
      clone.volume = s.volume;
      if (type === 'hum') {
        s.loop = true;
        s.volume = 0.1;
        s.play().catch(()=>{});
      } else {
        clone.play().catch(()=>{});
      }
    } catch(e){}
  }
};

// ----------------------------------------------------------------------
// 2. UI CONTROLLER
// ----------------------------------------------------------------------
const UI = {

  setWorkerProcessing: (id, processing=true) => {
    const card = document.getElementById(id);
    if (!card) return;
    const statusEl = card.querySelector('.worker-status');
    const spinnerEl = card.querySelector('.worker-spinner');
    if (processing) {
      if (statusEl) statusEl.innerText = 'Processing...';
      if (spinnerEl) spinnerEl.classList.remove('hidden');
      card.classList.add('processing');
    } else {
      if (statusEl) statusEl.innerText = '';
      if (spinnerEl) spinnerEl.classList.add('hidden');
      card.classList.remove('processing');
    }
  },

  renderLeaderboard: (domain='coding') => {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const data = leaderboardData[domain] || leaderboardData['coding'];
    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="font-mono text-gradient">#${item.rank}</span></td>
        <td>${item.model}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:50px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;">
              <div style="width:${item.score * 10}%;height:100%;background:var(--color-aptos);border-radius:2px;"></div>
            </div>
            <span class="font-mono">${item.score}</span>
          </div>
        </td>
        <td class="font-mono text-gradient">${item.credits} APT</td>
      `;
      tbody.appendChild(row);
    });
  },

  renderComparisonTable: (workerBData, workerCData) => {
    const tbody = document.getElementById('results-comparison-body');
    if (!tbody) return;

    const bName = document.getElementById('worker-b-model-name')?.innerText || 'Worker B';
    const cName = document.getElementById('worker-c-model-name')?.innerText || 'Worker C';

    tbody.innerHTML = '';

    const lookupStats = (name) => {
      const short = name.split(' ')[0];
      return leaderboardData['coding'].find(m => m.model.includes(short)) || { score: 8.0, credits: "10.00" };
    };

    const agents = [
      { name: bName, role: 'Worker B', current: workerBData },
      { name: cName, role: 'Worker C', current: workerCData }
    ];

    agents.forEach(agent => {
      const stats = lookupStats(agent.name);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${agent.name} <span style="font-size:0.7em;color:gray">(${agent.role})</span></td>
        <td><span class="text-gradient">${agent.current?.score ?? '--'}</span></td>
        <td>${stats.score}</td>
        <td class="font-mono">${stats.credits} APT</td>
      `;
      tbody.appendChild(row);
    });
  },

  updateWalletDisplay: (address) => {
    const display = document.getElementById('user-wallet-display');
    const text = document.getElementById('wallet-address-text');
    const modal = document.getElementById('wallet-modal');
    if (!display || !text) return;
    if (address) {
      display.classList.remove('hidden');
      text.innerText = shortenAddress(address);
      modal?.classList.remove('open');
    }
  },

  toggleModal: (show) => {
    const modal = document.getElementById('about-modal');
    if (!modal) return;
    if (show) { modal.classList.add('open'); AudioEngine.play('click'); }
    else modal.classList.remove('open');
  },

  togglePromptModal: (show) => {
    const modal = document.getElementById('prompt-modal');
    if (!modal) return;
    if (show) { modal.classList.add('open'); AudioEngine.play('click'); }
    else modal.classList.remove('open');
  },

  showSection: (name) => {
    const sections = {
      input: document.getElementById('input-section'),
      loading: document.getElementById('loading-section'),
      results: document.getElementById('results-section')
    };
    Object.values(sections).forEach(s => {
      if (!s) return;
      s.classList.add('hidden');
      s.classList.remove('active-section');
    });
    const target = sections[name];
    if (target) {
      target.classList.remove('hidden');
      setTimeout(()=> target.classList.add('active-section'), 10);
    }
  },

  updateStep: (id, status) => {
    const step = document.getElementById(id);
    if (!step) return;
    const spinner = step.querySelector('.step-status');

    step.classList.remove('pending','active','completed');

    if (status === 'active') {
      step.classList.add('active');
      if (spinner) spinner.innerHTML = '<div class="spinner"></div>';
    } else if (status === 'completed') {
      step.classList.add('completed');
      if (spinner) spinner.innerHTML = '<i data-lucide="check" class="text-emerald-400"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      AudioEngine.play('click');
    }
  },

  scrambleText: (id, finalText) => {
    const el = document.getElementById(id);
    if (!el) return;
    AudioEngine.play('glitch');
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.8s ease-out';
    el.innerText = finalText;
    void el.offsetWidth;
    el.style.opacity = '1';
  },

  drawConnections: () => {
    const svg = document.getElementById('swarm-connections');
    const orchestrator = document.getElementById('orchestrator-card');
    const workerB = document.getElementById('worker-b');
    const workerC = document.getElementById('worker-c');
    const container = document.getElementById('results-section');
    if (!svg || !orchestrator || !workerB || !workerC || !container) return;

    const rel = (el) => {
      const r = el.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      return {
        x: (r.left + r.width/2) - c.left,
        top: r.top - c.top,
        bottom: (r.top + r.height) - c.top
      };
    };

    const o = rel(orchestrator);
    const b = rel(workerB);
    const c2 = rel(workerC);

    const drawCable = (x1,y1,x2,y2) => {
      const mid = (y1+y2)/2;
      const d = `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;

      const base = document.createElementNS("http://www.w3.org/2000/svg","path");
      base.setAttribute("d", d);
      base.setAttribute("class", "cable-base");

      const flow = document.createElementNS("http://www.w3.org/2000/svg","path");
      flow.setAttribute("d", d);
      flow.setAttribute("class","cable-flow");

      const dist = Math.abs(y2-y1)+Math.abs(x2-x1);
      flow.style.strokeDasharray = `50, ${dist}`;

      svg.appendChild(base);
      svg.appendChild(flow);
    };

    svg.innerHTML = '';
    drawCable(o.x, o.bottom, b.x, b.top);
    drawCable(o.x, o.bottom, c2.x, c2.top);
  },

  revealResults: (workerB, workerC) => {
    const items = [
      document.querySelector('.result-card'),
      document.getElementById('worker-b'),
      document.getElementById('worker-c'),
      document.querySelector('.payment-bar'),
      document.querySelector('.glass-panel.delay-300')
    ];

    items.forEach((el,i)=>{
      if (!el) return;
      el.classList.remove('hidden');
      el.classList.add('slide-in-up');
      el.style.animationDelay = `${i*150}ms`;
    });

    const btn = document.getElementById('view-prompt-btn');

    if (btn) {
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click',()=>{
        const txt = clone.dataset.prompt || "No refined prompt.";
        const tgt = document.getElementById('refined-prompt-content');
        if (tgt) tgt.innerText = txt;
        UI.togglePromptModal(true);
      });
    }

    setTimeout(()=>{
      UI.drawConnections();
      window.addEventListener('resize', UI.drawConnections);
      UI.renderComparisonTable(workerB, workerC);
    },600);

    const pie = document.getElementById('contribution-pie');
    if (pie && workerB && typeof workerB.percent === 'number') {
      pie.style.background = `conic-gradient(
        var(--color-emerald) 0% ${workerB.percent}%,
        var(--color-blue) ${workerB.percent}% 100%
      )`;
    }
  }
};
// ----------------------------------------------------------------------
// 3. APP LOGIC (Backend Communication)
// ----------------------------------------------------------------------
const AppLogic = {
  startDelegation: async (query, agentConfig) => {

    // Show loading
    UI.showSection('loading');

    console.log("Sending to backend:", { query, agentConfig });

    // Immediately show worker "Processing..."
    UI.setWorkerProcessing('worker-b', true);
    UI.setWorkerProcessing('worker-c', true);

    // Step progress animation
    UI.updateStep('step-1', 'active');

    const payload = {
      question: query,
      orchestratorAddress: agentConfig.orchestrator,
      workerAddresses: [
        agentConfig.workerA,
        agentConfig.workerB
      ]
    };

    // BEGIN FETCH
    const fetchPromise = fetch(API_URL, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try {
          const body = await res.json().catch(()=>null);
          if (body?.message || body?.error) msg = body.message || body.error;
        } catch(e){}
        throw new Error(msg);
      }
      return res.json();
    })
    .catch(err => {
      console.error("Backend error:", err);
      return { error: true, message: err.message || "Unknown error" };
    });

    // UI pacing
    await wait(1200);
    UI.updateStep('step-1', 'completed');

    UI.updateStep('step-2', 'active');
    await wait(1200);
    UI.updateStep('step-2', 'completed');

    UI.updateStep('step-3', 'active');

    const data = await fetchPromise;

    // ------------------------------------------------------------------
    // HANDLE FAILURES
    // ------------------------------------------------------------------
    if (data.error) {
      UI.setWorkerProcessing('worker-b', false);
      UI.setWorkerProcessing('worker-c', false);

      alert(`❌ Delegation Failed — ${data.message}\nCheck backend logs.`);
      UI.showSection('input');
      return;
    }

    // ------------------------------------------------------------------
    // NORMALIZE WORKER DATA (🔥 IMPORTANT FIX)
    // Backend returns any of these shapes:
    // worker_b, workerA, worker1 → Worker B
    // worker_c, workerB, worker2 → Worker C
    // ------------------------------------------------------------------
    const workerB = data.worker_b || data.workerA || data.worker1 || {};
    const workerC = data.worker_c || data.workerB || data.worker2 || {};

    // ------------------------------------------------------------------
    // UPDATE MODEL NAME LABELS FROM DROPDOWN (🔥 Option B Fix)
    // ------------------------------------------------------------------
    const orchName = document.getElementById("orch-model-name");
    const workerBName = document.getElementById("worker-b-model-name");
    const workerCName = document.getElementById("worker-c-model-name");

    // Helper to extract friendly label from dropdown
    const getDropdownLabel = (selectEl, value) => {
      const option = [...selectEl.options].find(o => o.value === value);
      return option?.dataset?.name || value;
    };

    const selectOrch = document.getElementById("select-orchestrator");
    const selectB = document.getElementById("select-worker-a");
    const selectC = document.getElementById("select-worker-b");

    if (orchName) orchName.innerText = getDropdownLabel(selectOrch, agentConfig.orchestrator);
    if (workerBName) workerBName.innerText = getDropdownLabel(selectB, agentConfig.workerA);
    if (workerCName) workerCName.innerText = getDropdownLabel(selectC, agentConfig.workerB);

    // ------------------------------------------------------------------
    // UPDATE RESPONSES
    // ------------------------------------------------------------------
    const agentBResp = document.getElementById('agent-b-response');
    const agentCResp = document.getElementById('agent-c-response');

    if (agentBResp && workerB.response) agentBResp.innerText = workerB.response;
    if (agentCResp && workerC.response) agentCResp.innerText = workerC.response;

    // Orchestrator analysis text
    if (data.orchestrator?.analysis) {
      UI.scrambleText("orchestrator-text", data.orchestrator.analysis);
    }

    // ------------------------------------------------------------------
    // UPDATE WORKER CARDS + PAYMENT
    // ------------------------------------------------------------------
    updateWorkerCard("worker-b", workerB);
    updateWorkerCard("worker-c", workerC);
    updatePaymentSummary(workerB, workerC);

    // Stop processing indicators
    UI.setWorkerProcessing('worker-b', false);
    UI.setWorkerProcessing('worker-c', false);

    // Final steps
    UI.updateStep('step-3', 'completed');
    UI.updateStep('step-4', 'active');
    await wait(600);
    UI.updateStep('step-4', 'completed');

    // Show results panel
    UI.showSection('results');

    // Run reveal animation
    UI.revealResults(workerB, workerC);
  }
};

// ----------------------------------------------------------------------
// 4. HELPERS: UPDATE WORKER CARDS + PAYMENT BAR (DROPDOWN FIX)
// ----------------------------------------------------------------------
function updateWorkerCard(id, workerData) {
  const card = document.getElementById(id);
  if (!card || !workerData) return;

  // NAME UPDATE — DROPDOWN LABEL ONLY
  const nameEl = document.getElementById(`${id}-model-name`);
  if (nameEl && workerData) {
    // Keep previous name (we already set dropdown name earlier)
    // Do NOT overwrite it with model or address
  }

  const percentEl = card.querySelector('.percentage');
  if (percentEl)
    percentEl.textContent = workerData.score ?? "0";

  const circle = card.querySelector(".circle");
  if (circle && typeof workerData.score === "number") {
    const dash = `${workerData.score * 10}, 100`;
    circle.setAttribute("stroke-dasharray", dash);
  }

  const payout = card.querySelector('.payout');
  if (payout) payout.innerText = `+ ${workerData.payment ?? 0} APT`;

  if (id === "worker-b" && workerData.refined_prompt) {
    const btn = card.querySelector("#view-prompt-btn");
    if (btn) {
      btn.classList.remove("hidden");
      btn.dataset.prompt = workerData.refined_prompt;
    }
  }

  const proofLink = card.querySelector(".tx-link");
  if (proofLink && workerData.proof_link) {
    proofLink.href = workerData.proof_link;
    proofLink.target = "_blank";
    proofLink.innerHTML = `<i data-lucide="external-link"></i> Verify on Chain`;
  }
}

function updatePaymentSummary(workerB, workerC) {
  const legend = document.querySelectorAll(".legend-item");
  if (legend.length >= 2) {
    legend[0].innerHTML = `<span class="dot emerald-bg"></span> Agent B (${workerB?.percent ?? 0}%)`;
    legend[1].innerHTML = `<span class="dot blue-bg"></span> Agent C (${workerC?.percent ?? 0}%)`;
  }

  setTimeout(() => {
    const barB = document.querySelector(".bar-segment.emerald-bg");
    const barC = document.querySelector(".bar-segment.blue-bg");

    if (barB) barB.style.width = `${workerB?.percent ?? 0}%`;
    if (barC) barC.style.width = `${workerC?.percent ?? 0}%`;
  }, 400);
}
// ----------------------------------------------------------------------
// 5. BOOT SEQUENCE + EVENT HANDLERS
// ----------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // DOM refs
  const submitBtn = document.getElementById("submit-btn");
  const inputField = document.getElementById("user-query");
  const resetBtn = document.getElementById("reset-btn");

  const walletModal = document.getElementById("wallet-modal");
  const walletInput = document.getElementById("wallet-input");
  const walletConnectBtn = document.getElementById("wallet-connect-btn");
  const walletLaterBtn = document.getElementById("wallet-later-btn");

  const selects = [
    document.getElementById("select-orchestrator"),
    document.getElementById("select-worker-a"),
    document.getElementById("select-worker-b")
  ];

  const aboutBtn = document.getElementById("about-btn");
  const closeAboutModalBtn = document.getElementById("close-modal");
  const closePromptModalBtn = document.getElementById("close-prompt-modal");
  const aboutModal = document.getElementById("about-modal");

  // Initialize audio + leaderboard
  AudioEngine.init();
  UI.renderLeaderboard("coding");
  if (typeof lucide !== "undefined") lucide.createIcons();

  // ------------------------------------------------------------------
  // Ensure same agent can't be selected twice
  // ------------------------------------------------------------------
  const updateSelectOptions = () => {
    const selected = selects
      .map(s => s?.value)
      .filter(v => v && v !== "");

    selects.forEach(select => {
      if (!select) return;

      const current = select.value;
      [...select.options].forEach(opt => {
        if (opt.value === "") return;

        if (selected.includes(opt.value) && opt.value !== current) {
          opt.disabled = true;
          opt.innerText = `${opt.dataset.name} (Selected)`;
        } else {
          opt.disabled = false;
          opt.innerText = opt.dataset.name;
        }
      });
    });
  };

  selects.forEach(sel => {
    if (sel) {
      sel.addEventListener("change", () => {
        updateSelectOptions();
        AudioEngine.play("click");
      });
    }
  });

  updateSelectOptions();

  // ------------------------------------------------------------------
  // Wallet Connect
  // ------------------------------------------------------------------
  const stored = localStorage.getItem("aptos_synapse_wallet");
  if (stored) {
    UI.updateWalletDisplay(stored);
    walletModal?.classList.remove("open");
  }

  walletConnectBtn?.addEventListener("click", () => {
    const addr = walletInput?.value.trim();
    if (addr && addr.length > 5) {
      localStorage.setItem("aptos_synapse_wallet", addr);
      UI.updateWalletDisplay(addr);
      AudioEngine.play("click");
    } else {
      walletInput.style.borderColor = "red";
      setTimeout(() => {
        walletInput.style.borderColor = "var(--border-light)";
      }, 1000);
    }
  });

  walletLaterBtn?.addEventListener("click", () => {
    walletModal?.classList.remove("open");
    AudioEngine.play("click");
  });

  // ------------------------------------------------------------------
  // Submit Handler
  // ------------------------------------------------------------------
  const handleSubmit = () => {
    // Require wallet first
    if (!localStorage.getItem("aptos_synapse_wallet")) {
      walletModal.classList.add("open");
      walletInput.focus();
      AudioEngine.play("glitch");
      return;
    }

    // Require all 3 agent selections
    if (!selects[0].value || !selects[1].value || !selects[2].value) {
      alert("Please select all 3 agent roles before starting.");
      AudioEngine.play("glitch");
      return;
    }

    const query = inputField.value.trim();
    if (!query) return;

    const agentConfig = {
      orchestrator: selects[0].value,
      workerA: selects[1].value,
      workerB: selects[2].value
    };

    // Set UI labels using dropdown names
    const setDropdownLabel = (elementId, selectEl, val) => {
      const out = document.getElementById(elementId);
      if (!out) return;
      const opt = [...selectEl.options].find(o => o.value === val);
      out.innerText = opt?.dataset?.name || val;
    };

    setDropdownLabel("orch-model-name", selects[0], agentConfig.orchestrator);
    setDropdownLabel("worker-b-model-name", selects[1], agentConfig.workerA);
    setDropdownLabel("worker-c-model-name", selects[2], agentConfig.workerB);

    // Show worker processing
    UI.setWorkerProcessing("worker-b", true);
    UI.setWorkerProcessing("worker-c", true);

    AppLogic.startDelegation(query, agentConfig);
  };

  submitBtn?.addEventListener("click", handleSubmit);

  inputField?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
  });

  // ------------------------------------------------------------------
  // UI Features (Cursor, Tilt, Buttons, Modals)
  // ------------------------------------------------------------------
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");

  document.addEventListener("mousemove", (e) => {
    if (cursorDot && cursorRing) {
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;

      cursorRing.animate({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`
      }, { duration: 400, fill: "forwards" });
    }

    const root = document.documentElement.style;
    root.setProperty("--cursor-x", e.clientX / window.innerWidth);
    root.setProperty("--cursor-y", e.clientY / window.innerHeight);
  });

  if (typeof VanillaTilt !== "undefined") {
    VanillaTilt.init(document.querySelectorAll(".glass-panel"), {
      max: 10,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.02
    });
  }

  document.querySelectorAll(".magnetic-btn").forEach(btn => {
    btn.addEventListener("mouseenter", () => document.body.classList.add("hovering"));
    btn.addEventListener("mouseleave", () => document.body.classList.remove("hovering"));
  });

  resetBtn?.addEventListener("click", () => {
    AudioEngine.play("click");
    window.location.reload();
  });

  aboutBtn?.addEventListener("click", () => UI.toggleModal(true));
  closeAboutModalBtn?.addEventListener("click", () => UI.toggleModal(false));
  aboutModal?.addEventListener("click", (e) => {
    if (e.target === aboutModal) UI.toggleModal(false);
  });

  closePromptModalBtn?.addEventListener("click", () =>
    UI.togglePromptModal(false)
  );

  // ------------------------------------------------------------------
  // Boot Screen Animation
  // ------------------------------------------------------------------
  const runBootSeq = async () => {
    const biosScreen = document.getElementById("bios-screen");
    const biosLog = document.getElementById("bios-log");

    if (!biosLog) return;

    const logs = [
      "Initializing Aptos Neural Core...",
      "Loading Move Modules...",
      "Connecting to Mainnet...",
      "ACCESS GRANTED."
    ];

    for (let line of logs) {
      const div = document.createElement("div");
      div.className = "bios-line";
      div.innerText = line;
      biosLog.appendChild(div);
      await wait(120);
    }

    if (biosScreen) {
      setTimeout(() => {
        biosScreen.style.opacity = "0";
        biosScreen.style.transition = "opacity 0.5s ease";
        setTimeout(() => biosScreen.style.display = "none", 500);
      }, 500);
    }
  };

  runBootSeq();

  console.log("Aptos Synapse UI initialized.");
});
