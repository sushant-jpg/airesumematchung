"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { jobs } from "@/lib/data";
import { JobCard } from "./job-card";
export function JobsExplorer() {
  const [query, setQuery] = useState(""); const [mode, setMode] = useState("All"); const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => jobs.filter((job) => `${job.title} ${job.company} ${job.skills.join(" ")}`.toLowerCase().includes(deferredQuery.toLowerCase()) && (mode === "All" || job.mode === mode)), [deferredQuery, mode]);
  return <><div className="card mb-8 flex flex-col gap-3 p-3 md:flex-row"><label className="relative flex-1"><span className="sr-only">Search jobs</span><Search className="absolute left-4 top-3.5 text-ink/40" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="input border-0 pl-11" placeholder="Role, company, or skill"/></label><label className="flex items-center gap-2 rounded-xl border border-ink/10 px-4"><SlidersHorizontal size={17}/><span className="sr-only">Work mode</span><select className="h-12 bg-transparent text-sm" value={mode} onChange={(event) => setMode(event.target.value)}><option>All</option><option>Remote</option><option>Hybrid</option></select></label></div>{filtered.length ? <div className="grid gap-5 md:grid-cols-2">{filtered.map((job) => <JobCard job={job} key={job.id}/>)}</div> : <div className="card p-12 text-center"><p className="text-xl font-bold">No close matches yet</p><p className="mt-2 text-ink/60">Try a broader title or remove a filter.</p></div>}</>;
}
