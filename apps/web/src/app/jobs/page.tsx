import type { Metadata } from "next";
import { Header } from "@/components/header";
import { JobsExplorer } from "@/components/jobs-explorer";
export const metadata: Metadata = { title: "Find jobs" };
export default function JobsPage() { return <><Header/><main className="mx-auto max-w-6xl px-5 py-14"><p className="eyebrow">Evidence-based search</p><h1 className="display mt-3 text-5xl sm:text-6xl">Your next role, without the guesswork.</h1><p className="mb-10 mt-4 max-w-2xl text-ink/60">Search opportunities and see how your experience lines up before you apply.</p><JobsExplorer/></main></>; }
