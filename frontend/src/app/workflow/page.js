"use client";

import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { AppShell, PageHeading, StatusPill } from "../components/AppShell";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const agents = [
  { task: "ocr", name: "OCR Agent", description: "Extract text from the uploaded document." },
  { task: "summary", name: "Summary Agent", description: "Create a short, readable document brief." },
  { task: "fraud", name: "Fraud Agent", description: "Check invoice content for risk indicators." },
];
const riskTone = { LOW: "text-emerald-300", MEDIUM: "text-amber-300", HIGH: "text-orange-300", CRITICAL: "text-rose-300" };

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function FraudAnalysis({ result }) {
  const analysis = result?.riskLevel
    ? result
    : result?.result?.riskLevel
      ? result.result
      : result?.output?.riskLevel
        ? result.output
        : result?.output?.result || {};
  return <div className="mt-4 space-y-6">
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Risk level</p>
      <p className={`mt-2 text-3xl font-semibold ${riskTone[analysis.riskLevel] || "text-white"}`}>{analysis.riskLevel || "UNKNOWN"}</p>
      <p className="mt-1 text-sm text-slate-300">Risk score: {analysis.riskScore ?? 0} / 100</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Risk factors</p>
      {analysis.riskFactors?.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">{analysis.riskFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul> : <p className="mt-3 text-sm text-emerald-300">None detected</p>}
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Explanation</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{analysis.explanation || analysis.message}</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended action</p>
      <p className="mt-3 text-sm leading-6 text-white">{analysis.recommendedAction || analysis.recommendation}</p>
    </div>
  </div>;
}

export default function WorkflowPage() {
  const { activeAddress, transactionSigner } = useWallet();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [selectedTasks, setSelectedTasks] = useState(["ocr", "summary", "fraud"]);
  const [inputText, setInputText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function selectFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError("");
    setPreview(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : "");
    if (selected.type.startsWith("text/") || /\.(txt|csv|json)$/i.test(selected.name)) setInputText(await selected.text());
    else setInputText(`File selected: ${selected.name}\nType: ${selected.type || "unknown"}\nSize: ${(selected.size / 1024).toFixed(1)} KB`);
  }

  async function runWorkflow() {
    if (!file) return setError("Choose a document before starting the workflow.");
    if (!selectedTasks.length) return setError("Select at least one agent before starting the workflow.");
    if (file.size > 10 * 1024 * 1024) return setError("File exceeds the maximum allowed size of 10 MB.");
    const supported = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|tiff?|pdf|txt|csv|json)$/i.test(file.name);
    if (!supported) return setError("Unsupported file type. Upload PNG, JPG, PDF, TXT, CSV, or JSON.");
    if (!activeAddress || !transactionSigner) return setError("Connect your wallet before running a paid workflow.");
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(file.name);
      const imageBase64 = isImage ? await readFile(file) : null;
      const task = selectedTasks.length === 3 ? "all" : selectedTasks[0];
      const body = { file: file.name, task, text: inputText, hasText: Boolean(inputText.trim()), hasImageBase64: Boolean(imageBase64), imageBase64 };
      const signer = { address: activeAddress, signTransactions: (txns, indexes) => transactionSigner(txns, indexes) };
      const client = new x402Client().register("algorand:*", new ExactAvmScheme(signer));
      const httpClient = new x402HTTPClient(client);
      const first = await fetch(`${BACKEND_URL}/api/orchestrate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (first.status !== 402) throw new Error(await first.text() || `Payment request failed with HTTP ${first.status}`);
      const headers = Object.fromEntries(first.headers);
      const required = httpClient.getPaymentRequiredResponse((name) => headers[name.toLowerCase()], null);
      const payload = await httpClient.createPaymentPayload(required);
      const encodedPaymentHeaders = httpClient.encodePaymentSignatureHeader(payload);
      const paymentHeaders = Object.fromEntries(new Headers(encodedPaymentHeaders).entries());
      const paid = await fetch(`${BACKEND_URL}/api/orchestrate`, { method: "POST", headers: { "Content-Type": "application/json", ...paymentHeaders }, body: JSON.stringify(body) });
      const responseText = await paid.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; } catch { /* Keep the HTTP error below. */ }
      if (!paid.ok || !data.success) throw new Error(data.message || data.error || responseText || `Workflow execution failed (HTTP ${paid.status})`);
      setResult(data);
    } catch (runError) {
      setError(runError.message || "Workflow failed.");
    } finally {
      setRunning(false);
    }
  }

  const output = result?.result?.output || result?.result || {};
  const singleFraudResult = output?.riskLevel
    ? output
    : output?.result?.riskLevel
      ? output.result
      : output?.output?.result || {};
  const selectedAgentLabel = selectedTasks.length === 3 ? "OCR + Summary + Fraud" : selectedTasks.map((item) => agents.find((agent) => agent.task === item)?.name).join(" + ");
  return <AppShell eyebrow="NEW WORKFLOW">
    <PageHeading eyebrow="Document processing" title="Run a workflow" description="Upload a document, choose a specialist, and receive a persisted result through x402." />
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">01 · Upload document</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Choose your source file</h2>
          <label className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-300/30 bg-cyan-300/[0.04] text-center hover:bg-cyan-300/[0.08]">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.json" onChange={selectFile} className="hidden" />
            {preview ? <img src={preview} alt="Document preview" className="max-h-36 max-w-full rounded-lg object-contain" /> : <><span className="text-3xl text-cyan-300">＋</span><span className="mt-2 text-sm font-medium text-white">Choose a file</span><span className="mt-1 text-xs text-slate-500">PNG, JPG, PDF, TXT, CSV, or JSON</span></>}
            {file && <span className="mt-3 text-xs text-cyan-200">{file.name} · {(file.size / 1024).toFixed(1)} KB</span>}
          </label>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">02 · Select agent</p>
          <div className="mt-4 space-y-3">{agents.map((agent) => { const selected = selectedTasks.includes(agent.task); return <button key={agent.task} onClick={() => setSelectedTasks((current) => selected ? current.filter((item) => item !== agent.task) : [...current, agent.task])} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${selected ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><span><span className="block font-medium text-white">{agent.name}</span><span className="mt-1 block text-xs text-slate-500">{agent.description}</span></span><span className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${selected ? "border-cyan-300 bg-cyan-300 text-[#07111f]" : "border-slate-600"}`}>{selected ? "✓" : ""}</span></button>; })}</div>
        </div>
      </section>
      <section className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">03 · Review and run</p>
          <div className="mt-5 flex items-center justify-between gap-4"><span className="text-sm text-slate-400">Selected agents</span><StatusPill status={selectedAgentLabel || "Select an agent"} /></div>
          <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} className="mt-5 h-36 w-full resize-none rounded-xl border border-white/10 bg-[#07111f] p-4 text-sm text-slate-200 outline-none focus:border-cyan-300/50" placeholder="Optional text input or extracted document text" />
          <button onClick={runWorkflow} disabled={running} className="mt-5 w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-semibold text-[#07111f] disabled:cursor-wait disabled:opacity-60">{running ? "Processing workflow..." : "Pay 0.01 USDC and run"}</button>
          {error && <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
        </div>
        {result && <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Workflow completed</p><h2 className="mt-2 text-lg font-semibold text-white">{file?.name}</h2></div><StatusPill status="completed" /></div>{result.agents ? <div className="mt-5 space-y-4">{Object.entries(result.agents).map(([name, agentResult]) => <div key={name} className="rounded-xl bg-[#07111f] p-5"><p className="text-xs uppercase tracking-wider text-slate-500">{name} result</p>{name === "fraud" ? <FraudAnalysis result={agentResult} /> : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{agentResult.summary || agentResult.output?.text || agentResult.text || agentResult.message || "Agent completed successfully."}</p>}</div>)}</div> : <div className="mt-5 rounded-xl bg-[#07111f] p-5">{selectedTasks.length === 1 && selectedTasks[0] === "fraud" ? <FraudAnalysis result={singleFraudResult} /> : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{output.summary || output.text || output.message || output.result?.message || result.message || "Agent completed successfully."}</p>}</div>}<p className="mt-4 font-mono text-xs text-slate-500">Workflow {result.workflowId}</p></div>}
      </section>
    </div>
  </AppShell>;
}
