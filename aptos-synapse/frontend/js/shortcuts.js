// Keyboard shortcut listener for power users
document.addEventListener("keydown", (e) => {
  // Ctrl+Enter or Cmd+Enter to execute swarm
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const executeBtn = document.getElementById("execute-btn") || document.querySelector(".btn-execute");
    if (executeBtn && !executeBtn.disabled) {
      executeBtn.click();
    }
  }

  // Escape to close active modal or clear inputs
  if (e.key === "Escape") {
    const modal = document.querySelector(".modal-backdrop, .wallet-modal");
    if (modal && modal.style.display !== "none") {
      modal.style.display = "none";
    }
  }
});
