"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../components/AppShell";
import { apiGet } from "../components/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { apiGet("/api/payments").then((data) => setPayments(data.payments || [])).catch((err) => setError(err.message)); }, []);
  return <AppShell eyebrow="PAYMENTS"><PageHeading eyebrow="x402 settlement ledger" title="Payment history" description="Track USDC usage for every agent request and workflow." action={<Link href="/transactions" className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white hover:bg-white/5">View transactions</Link>} />{error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}{payments.length === 0 ? <EmptyState title="No payments yet" description="Your settled x402 payments will appear here after a workflow completes." /> : <div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 bg-white/[0.03] px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500"><span>Transaction</span><span>Agent</span><span>Amount</span><span>Status</span></div>{payments.map((payment) => <div key={payment._id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-t border-white/10 px-5 py-4 text-sm"><span className="truncate font-mono text-xs text-slate-400">{payment.transactionId || payment._id}</span><span className="text-slate-200">{payment.agentId?.name || "Agent request"}</span><span className="text-white">${Number(payment.amount || 0).toFixed(2)} {payment.currency || "USDC"}</span><StatusPill status={payment.status} /></div>)}</div>}</AppShell>;
}
