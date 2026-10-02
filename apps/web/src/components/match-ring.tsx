import React from "react";

export function MatchRing({ score, size = "large" }: { score: number; size?: "large" | "small" }) {
  const diameter = size === "large" ? 104 : 56; const stroke = size === "large" ? 9 : 6; const radius = (diameter - stroke) / 2; const circumference = 2 * Math.PI * radius;
  return <div className="relative shrink-0" style={{ width: diameter, height: diameter }} aria-label={`${score}% match`}><svg className="-rotate-90" width={diameter} height={diameter}><circle cx={diameter/2} cy={diameter/2} r={radius} fill="none" stroke="currentColor" className="text-ink/10" strokeWidth={stroke}/><circle cx={diameter/2} cy={diameter/2} r={radius} fill="none" stroke="#1b4938" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1-score/100)}/></svg><div className="absolute inset-0 grid place-items-center"><span className={size === "large" ? "text-2xl font-bold" : "text-sm font-bold"}>{score}%</span></div></div>;
}
