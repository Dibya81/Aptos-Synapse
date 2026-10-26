function exportResultsAsJSON(data, filename = "synapse_swarm_results.json") {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportResultsAsMarkdown(data, filename = "synapse_swarm_results.md") {
  let md = `# Aptos Synapse Swarm Execution Summary\n\n`;
  md += `- **Timestamp**: ${new Date().toISOString()}\n`;
  md += `- **Task ID**: ${data.taskId || "N/A"}\n`;
  md += `- **Composite Quality Score**: ${data.compositeScore || "N/A"}\n\n`;
  md += `## Orchestrator Plan\n${data.orchestratorPlan || "None"}\n\n`;
  
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
