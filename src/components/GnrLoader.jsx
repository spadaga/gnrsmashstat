import { useId } from "react";

export default function GnrLoader({ message = "Getting the court ready…" }) {
  const patternId = useId();
  return (
    <div role="status" aria-live="polite" className="gnr-loader">
      <div aria-hidden="true" className="gnr-loader-art bg-white dark:bg-slate-900">
        <div className="gnr-loader-scene">
        <div className="gnr-loader-hanger" />
        <div className="gnr-loader-letters">
          {["G", "N", "R"].map((letter, index) => (
            <div key={letter} className="gnr-loader-letter" style={{ "--letter-index": index }}>
              <span>{letter}</span>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 280 145" className="gnr-loader-court" fill="none">
          <defs>
            <pattern id={patternId} width="7" height="7" patternUnits="userSpaceOnUse">
              <path d="M0 0H7M0 0V7" stroke="currentColor" strokeWidth=".65" opacity=".55" />
            </pattern>
          </defs>
          <ellipse cx="140" cy="130" rx="96" ry="7" className="gnr-loader-shadow" fill="currentColor" opacity=".09" />
          <path d="M34 125H246M76 125L98 86H182L204 125M85 108H195M140 87V125" stroke="currentColor" opacity=".17" strokeWidth="1.5" />
          <g className="gnr-loader-racket">
            <g transform="translate(68 61) rotate(-28)">
              <ellipse rx="24" ry="32" fill={`url(#${patternId})`} stroke="currentColor" strokeWidth="3" />
              <ellipse rx="20" ry="28" stroke="currentColor" strokeWidth=".8" opacity=".5" />
              <path d="M-7 31L0 43L7 31M0 43V65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M0 65V84" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <path d="M-3 68L3 71M-3 74L3 77" stroke="white" strokeWidth="1.2" opacity=".65" />
            </g>
          </g>
          <path className="gnr-loader-flight" d="M92 52Q157 -2 226 54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 7" opacity=".3" />
          <g className="gnr-loader-shuttle">
            <g transform="translate(167 29) rotate(35)">
              <path d="M-6 8L-17-18Q0-25 17-18L6 8Z" fill="currentColor" fillOpacity=".09" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M-3 7L-9-21M0 7V-23M3 7L9-21M-13-7H13M-9 2H9" stroke="currentColor" strokeWidth="1.1" />
              <path d="M-6 8H6V12A6 6 0 0 1-6 12Z" fill="currentColor" />
            </g>
          </g>
          <g className="gnr-loader-spark" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
            <path d="M100 23V32M96 27H104M228 78V85M224 82H232" />
          </g>
        </svg>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  );
}
