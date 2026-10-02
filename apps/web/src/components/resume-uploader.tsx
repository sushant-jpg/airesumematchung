"use client";
import { useState } from "react";
import { FileCheck2, UploadCloud } from "lucide-react";
export function ResumeUploader() {
  const [file, setFile] = useState<File>(); const [error, setError] = useState("");
  function choose(next?: File) { setError(""); if (!next) return; if (next.type !== "application/pdf") return setError("Choose a PDF file. The filename alone is not used for validation."); if (!next.size) return setError("The selected PDF is empty."); if (next.size > 5 * 1024 * 1024) return setError("Resume must be 5 MB or smaller."); setFile(next); }
  return <div><label className="focus-within:ring-2 focus-within:ring-forest block cursor-pointer rounded-3xl border-2 border-dashed border-ink/15 bg-paper p-10 text-center"><input className="sr-only" type="file" accept="application/pdf" onChange={(event) => choose(event.target.files?.[0])}/>{file ? <FileCheck2 className="mx-auto text-forest" size={40}/> : <UploadCloud className="mx-auto text-forest" size={40}/>}<p className="mt-4 font-bold">{file ? file.name : "Drop your resume here, or choose a file"}</p><p className="mt-2 text-sm text-ink/50">Private PDF · maximum 5 MB</p></label>{error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}{file && <button className="mt-4 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white">Parse resume securely</button>}</div>;
}
