"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@txnlab/use-wallet-react";

const navItems = [
  ["Dashboard", "/"],
  ["Agents", "/agents"],
  ["Workflows", "/workflows"],
  ["Payments", "/payments"],
  ["Transactions", "/transactions"],
  ["Wallet", "/wallet"],
  ["Profile", "/profile"],
];

export function AppShell({ children, eyebrow = "AGENTHUB" }) {
  const pathname = usePathname();
  const { activeAddress } = useWallet();

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#091827] px-5 py-7 lg:block">
          <Link href="/" className="flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-[#07111f]">A</span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] text-white">AGENTHUB</span>
              <span className="text-xs text-slate-500">Document intelligence</span>
            </span>
          </Link>

          <nav className="mt-12 space-y-1">
            {navItems.map(([label, href]) => {
              const active = href === "/" ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? "bg-cyan-400/10 font-semibold text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-cyan-300" : "bg-slate-600"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-16">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Network</p>
              <p className="mt-2 text-sm text-white">Algorand Testnet</p>
              <p className="mt-1 truncate font-mono text-xs text-slate-500">{activeAddress || "Wallet not connected"}</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-cyan-300">{eyebrow}</p>
              <p className="mt-1 text-xs text-slate-500">Intelligent document workflows</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`hidden rounded-full border px-3 py-1.5 text-xs sm:block ${activeAddress ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-slate-500"}`}>
                {activeAddress ? "Wallet connected" : "Wallet offline"}
              </span>
              <Link href="/workflow" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-cyan-200">New workflow</Link>
            </div>
          </header>
          <nav className="flex gap-2 overflow-x-auto border-b border-white/10 px-5 py-3 lg:hidden">
            {navItems.slice(0, 5).map(([label, href]) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs ${pathname === href || (href !== "/" && pathname.startsWith(href)) ? "bg-cyan-300/10 text-cyan-200" : "text-slate-500"}`}>{label}</Link>)}
          </nav>
          <div className="px-5 py-8 sm:px-8 lg:px-10">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ status }) {
  const good = ["completed", "confirmed", "online"].includes(String(status).toLowerCase());
  return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${good ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-amber-400/25 bg-amber-400/10 text-amber-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${good ? "bg-emerald-300" : "bg-amber-300"}`} />{status}</span>;
}

export function EmptyState({ title, description, action }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center"><p className="text-lg font-medium text-white">{title}</p><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>{action}</div>;
}
