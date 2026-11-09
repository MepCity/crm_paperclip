import type { SVGProps } from "react";

export function FormCreationIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
      {...props}
    >
      <rect x="20" y="10" width="200" height="160" rx="28" className="fill-muted/40" />
      {/* Browser card */}
      <rect
        x="45"
        y="30"
        width="145"
        height="105"
        rx="8"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <line x1="45" y1="50" x2="190" y2="50" className="stroke-border" strokeWidth="1.5" />
      <circle cx="57" cy="40" r="3" fill="#cbd5e1" />
      <circle cx="67" cy="40" r="3" fill="#cbd5e1" />
      <circle cx="77" cy="40" r="3" fill="#cbd5e1" />

      {/* Simulated form fields */}
      <rect x="58" y="60" width="36" height="5" rx="2" fill="#cbd5e1" />
      <rect
        x="58"
        y="69"
        width="80"
        height="12"
        rx="3"
        className="fill-muted/60 stroke-border/80"
        strokeWidth="1"
      />
      <rect x="58" y="88" width="46" height="5" rx="2" fill="#cbd5e1" />
      <rect
        x="58"
        y="97"
        width="80"
        height="12"
        rx="3"
        className="fill-muted/60 stroke-border/80"
        strokeWidth="1"
      />

      {/* Plus action circular badge */}
      <circle cx="170" cy="116" r="20" fill="#f2722b" />
      <path
        d="M170 106 V126 M160 116 H180"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FormAnalyticsIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
      {...props}
    >
      <rect x="20" y="10" width="200" height="160" rx="28" className="fill-muted/40" />
      {/* Dashboard Card */}
      <rect
        x="45"
        y="30"
        width="145"
        height="105"
        rx="8"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <rect x="58" y="42" width="50" height="6" rx="2" fill="#cbd5e1" />

      {/* Grid lines */}
      <line
        x1="58"
        y1="75"
        x2="178"
        y2="75"
        className="stroke-border"
        strokeDasharray="3 3"
        strokeWidth="1"
      />
      <line
        x1="58"
        y1="100"
        x2="178"
        y2="100"
        className="stroke-border"
        strokeDasharray="3 3"
        strokeWidth="1"
      />

      {/* Trend line */}
      <path
        d="M58 84 Q86 62 114 74 T174 50"
        fill="none"
        stroke="#f2722b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Bar chart bars */}
      <rect x="66" y="80" width="12" height="35" rx="2" fill="#cbd5e1" />
      <rect x="86" y="66" width="12" height="49" rx="2" fill="#f2722b" />
      <rect x="106" y="75" width="12" height="40" rx="2" fill="#f2722b" opacity="0.75" />
      <rect x="126" y="58" width="12" height="57" rx="2" fill="#f2722b" />
      <rect x="146" y="72" width="12" height="43" rx="2" fill="#cbd5e1" />

      {/* Baseline */}
      <line
        x1="58"
        y1="115"
        x2="178"
        y2="115"
        className="stroke-border"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AbTestingIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
      {...props}
    >
      <rect x="20" y="10" width="200" height="160" rx="28" className="fill-muted/40" />
      {/* Variant A (left document) */}
      <rect
        x="50"
        y="34"
        width="70"
        height="92"
        rx="6"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <rect x="60" y="44" width="28" height="6" rx="2" fill="#f2722b" opacity="0.65" />
      <rect x="60" y="56" width="50" height="5" rx="2" fill="#cbd5e1" />
      <rect x="60" y="66" width="44" height="5" rx="2" fill="#cbd5e1" />
      <rect x="60" y="78" width="38" height="10" rx="2" fill="#e2e8f0" />

      {/* Variant B (right document, overlapping) */}
      <rect
        x="92"
        y="42"
        width="76"
        height="94"
        rx="6"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <rect x="103" y="53" width="32" height="6" rx="2" fill="#f2722b" />
      <rect x="103" y="65" width="54" height="5" rx="2" fill="#cbd5e1" />
      <rect x="103" y="76" width="48" height="5" rx="2" fill="#cbd5e1" />
      <rect x="103" y="89" width="42" height="12" rx="3" fill="#f2722b" />

      {/* Visitor avatar group */}
      <circle cx="56" cy="140" r="5" fill="#f2722b" />
      <path d="M49 153 C49 147 52 147 56 147 C60 147 63 147 63 153" fill="#f2722b" />
      <circle cx="70" cy="140" r="5" fill="#94a3b8" />
      <path d="M63 153 C63 147 66 147 70 147 C74 147 77 147 77 153" fill="#94a3b8" />
      <circle cx="84" cy="140" r="5" fill="#f2722b" />
      <path d="M77 153 C77 147 80 147 84 147 C88 147 91 147 91 153" fill="#f2722b" />
    </svg>
  );
}
