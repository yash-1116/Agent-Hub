"use client";

import Link from "next/link";
import { useWallet } from "@txnlab/use-wallet-react";
import { AppShell, PageHeading, StatusPill } from "../components/AppShell";

export default function ProfilePage() {
  const { activeAddress } = useWallet();
  return <AppShell eyebrow="PROFILE"><PageHeading eyebrow="Account settings" title="Your profile" description="Manage your AgentHub workspace and connected payment identity." /><div className="grid max-w-4xl gap-5 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Account</p><h2 className="mt-5 text-xl font-semibold text-white">Workspace owner</h2><p className="mt-2 text-sm text-slate-400">Authentication can be connected here when user accounts are enabled.</p><div className="mt-8 space-y-4"><div><p className="text-xs text-slate-500">Name</p><p className="mt-1 text-sm text-white">AgentHub user</p></div><div><p className="text-xs text-slate-500">Email</p><p className="mt-1 text-sm text-white">ys505306@gmail.com</p></div></div></div><div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment identity</p><div className="mt-5"><StatusPill status={activeAddress ? "Connected" : "Offline"} /><p className="mt-5 break-all font-mono text-xs text-slate-400">{activeAddress || "No wallet connected"}</p><p className="mt-5 text-sm text-slate-400">Algorand Testnet</p></div><Link href="/wallet" className="mt-8 inline-flex rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white hover:bg-white/5">Manage wallet</Link></div></div></AppShell>;
}
