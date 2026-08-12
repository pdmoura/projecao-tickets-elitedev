import type { CheckInResult } from "@/modules/check-in";

type GateResultStatus = CheckInResult["result"];

const colorClassByStatus: Record<GateResultStatus, string> = {
  ALREADY_USED: "text-gate-used",
  INVALID: "text-gate-invalid",
  VALID: "text-gate-valid",
  WRONG_EVENT: "text-gate-wrong-event",
};

function ResultArtwork({ status }: { status: GateResultStatus }) {
  if (status === "VALID") {
    return <><circle className="gate-result-ring" cx="50" cy="50" r="38" /><path className="gate-result-mark" d="m31 51 12 12 27-30" /></>;
  }

  if (status === "INVALID") {
    return <><circle className="gate-result-ring" cx="50" cy="50" r="38" /><path className="gate-result-mark" d="m35 35 30 30m0-30L35 65" /></>;
  }

  if (status === "ALREADY_USED") {
    return <><circle className="gate-result-ring" cx="50" cy="50" r="38" /><path className="gate-result-mark" d="M50 29v21l15 10" /><path className="gate-result-mark gate-result-mark-delay" d="M50 19v6m0 50v6M19 50h6m50 0h6" /><circle className="gate-result-dot" cx="50" cy="50" r="3.5" /></>;
  }

  return <><path className="gate-result-ring" d="M50 16 87 80H13L50 16Z" /><path className="gate-result-mark" d="M50 39v21" /><circle className="gate-result-dot" cx="50" cy="70" r="2.5" /></>;
}

export function GateResultIcon({ status }: { status: GateResultStatus }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-20 w-20 shrink-0 ${colorClassByStatus[status]} sm:h-[6.5rem] sm:w-[6.5rem]`}
      fill="none"
      key={status}
      style={{ filter: "drop-shadow(0 3px 8px color-mix(in srgb, currentColor 20%, transparent))" }}
      viewBox="0 0 100 100"
    >
      <style>{`
        .gate-result-ring, .gate-result-mark { stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
        .gate-result-ring { stroke-width: 3; stroke-dasharray: 250; stroke-dashoffset: 250; animation: gate-result-draw 4.8s cubic-bezier(.2,.8,.2,1) infinite; }
        .gate-result-mark { stroke-width: 5; stroke-dasharray: 110; stroke-dashoffset: 110; animation: gate-result-draw 4.8s .45s cubic-bezier(.2,.8,.2,1) infinite; }
        .gate-result-mark-delay { stroke-width: 3; animation-delay: .7s; }
        .gate-result-dot { fill: currentColor; opacity: 0; transform-origin: center; animation: gate-result-pop 4.8s .9s cubic-bezier(.2,1.4,.4,1) infinite; }
        @keyframes gate-result-draw { 0%, 10% { stroke-dashoffset: 250; } 38%, 82% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 250; } }
        @keyframes gate-result-pop { 0%, 30% { opacity: 0; transform: scale(0); } 42%, 82% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0); } }
        @media (prefers-reduced-motion: reduce) {
          .gate-result-ring, .gate-result-mark { stroke-dashoffset: 0; animation: none; }
          .gate-result-dot { opacity: 1; animation: none; }
        }
      `}</style>
      <ResultArtwork status={status} />
    </svg>
  );
}
