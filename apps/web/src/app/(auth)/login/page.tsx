import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function LoginPage() { return <div className="w-full"><p className="eyebrow">Welcome back</p><h1 className="display mt-3 text-5xl">Continue your search.</h1><p className="mb-8 mt-3 text-ink/60">No account yet? <Link className="font-bold text-forest underline" href="/register">Create one</Link></p><AuthForm mode="login"/></div>; }
