function copyToClipboard(text, feedbackElement) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (feedbackElement) {
        const original = feedbackElement.textContent;
        feedbackElement.textContent = "COPIED!";
        setTimeout(() => feedbackElement.textContent = original, 2000);
      }
    });
  }
}

function getAptosExplorerUrl(txHash, network = "testnet") {
  return `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`;
}
