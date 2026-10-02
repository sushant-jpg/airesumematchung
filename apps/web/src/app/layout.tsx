import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "HireMatch AI — Find work that fits", template: "%s | HireMatch AI" }, description: "Explainable resume-to-job matching for candidates and thoughtful hiring teams." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
