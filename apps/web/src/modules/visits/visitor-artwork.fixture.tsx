/**
 * Synthetic SVG artwork representing the promotional visitor panel diagram.
 * Excluded from AST UI message extraction as it is purely decorative vector illustration.
 */
export function VisitorArtwork({ slide: _slide }: { slide: number }) {
  return (
    <svg
      width="520"
      height="260"
      viewBox="0 0 520 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mx-auto select-none rounded-lg shadow-lg"
    >
      <defs>
        <filter
          id="card-shadow"
          x="30"
          y="135"
          width="220"
          height="115"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Outer mock window */}
      <rect width="520" height="260" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

      {/* Top mock window bar */}
      <path
        d="M0 8 C0 3.5 3.5 0 8 0 L512 0 C516.5 0 520 3.5 520 8 L520 26 L0 26 Z"
        fill="#1e293b"
      />
      <circle cx="16" cy="13" r="3.5" fill="#ef4444" />
      <circle cx="26" cy="13" r="3.5" fill="#f59e0b" />
      <circle cx="36" cy="13" r="3.5" fill="#10b981" />
      <text x="50" y="17" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
        Visitor Tracking
      </text>

      {/* Background CRM table */}
      <g>
        <text x="20" y="48" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Lead Name
        </text>
        <text x="110" y="48" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Company
        </text>
        <text x="195" y="48" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Status
        </text>
        <line x1="15" y1="54" x2="265" y2="54" stroke="#e2e8f0" strokeWidth="1" />

        {/* Row 1 - active */}
        <rect x="15" y="60" width="250" height="22" rx="3" fill="#f0f9ff" />
        <text x="20" y="75" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Patricia Boyle
        </text>
        <text x="110" y="75" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Acme Corp
        </text>
        <rect x="195" y="65" width="52" height="12" rx="2" fill="#dbeafe" />
        <text
          x="200"
          y="74"
          fill="#1d4ed8"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Contacted
        </text>

        {/* Row 2 */}
        <text x="20" y="99" fill="#0f172a" fontSize="9" fontFamily="sans-serif">
          James Wilson
        </text>
        <text x="110" y="99" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Global Systems
        </text>
        <rect x="195" y="89" width="30" height="12" rx="2" fill="#f1f5f9" />
        <text x="200" y="98" fill="#475569" fontSize="7.5" fontFamily="sans-serif">
          New
        </text>

        {/* Row 3 */}
        <text x="20" y="123" fill="#0f172a" fontSize="9" fontFamily="sans-serif">
          Sarah Connor
        </text>
        <text x="110" y="123" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Cyberdyne
        </text>
        <rect x="195" y="113" width="42" height="12" rx="2" fill="#f1f5f9" />
        <text x="200" y="122" fill="#475569" fontSize="7.5" fontFamily="sans-serif">
          Qualified
        </text>

        {/* Row 4 */}
        <text x="20" y="147" fill="#0f172a" fontSize="9" fontFamily="sans-serif">
          Michael Chang
        </text>
        <text x="110" y="147" fill="#475569" fontSize="9" fontFamily="sans-serif">
          Pacific Trade
        </text>
        <rect x="195" y="137" width="52" height="12" rx="2" fill="#dbeafe" />
        <text
          x="200"
          y="146"
          fill="#1d4ed8"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Contacted
        </text>
      </g>

      {/* Floating Card: Visit Detail */}
      <g filter="url(#card-shadow)">
        <rect
          x="40"
          y="145"
          width="200"
          height="100"
          rx="6"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        {/* Card header */}
        <text x="52" y="162" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Visit Detail
        </text>
        <line x1="40" y1="168" x2="240" y2="168" stroke="#f1f5f9" strokeWidth="1" />
        {/* Detail rows */}
        <text x="52" y="180" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">
          IP Address:
        </text>
        <text x="115" y="180" fill="#0f172a" fontSize="7.5" fontFamily="sans-serif">
          192.0.2.1
        </text>
        <text x="52" y="193" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">
          Current Page:
        </text>
        <text
          x="115"
          y="193"
          fill="#0284c7"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          /pricing
        </text>
        <text x="52" y="206" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">
          Time Spent:
        </text>
        <text x="115" y="206" fill="#0f172a" fontSize="7.5" fontFamily="sans-serif">
          3m 42s
        </text>
        <text x="52" y="219" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">
          Referrer:
        </text>
        <text
          x="115"
          y="219"
          fill="#0284c7"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          google.com
        </text>
        <text x="52" y="232" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">
          Lead Score:
        </text>
        <rect x="115" y="225" width="28" height="10" rx="2" fill="#dcfce7" />
        <text x="121" y="233" fill="#15803d" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
          +45
        </text>
      </g>

      {/* Right side illustration: Analytics & chat widget mock */}
      <g>
        {/* Analytics bar chart card */}
        <rect
          x="285"
          y="40"
          width="215"
          height="100"
          rx="6"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <text x="297" y="56" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Visitor Activity
        </text>
        <line x1="285" y1="62" x2="500" y2="62" stroke="#f1f5f9" strokeWidth="1" />
        {/* Bars */}
        <rect x="305" y="105" width="16" height="25" rx="2" fill="#38bdf8" />
        <rect x="330" y="90" width="16" height="40" rx="2" fill="#0284c7" />
        <rect x="355" y="75" width="16" height="55" rx="2" fill="#0284c7" />
        <rect x="380" y="85" width="16" height="45" rx="2" fill="#38bdf8" />
        <rect x="405" y="70" width="16" height="60" rx="2" fill="#0369a1" />
        <rect x="430" y="80" width="16" height="50" rx="2" fill="#0284c7" />
        <rect x="455" y="95" width="16" height="35" rx="2" fill="#38bdf8" />
        <line x1="297" y1="130" x2="488" y2="130" stroke="#e2e8f0" strokeWidth="1" />

        {/* Live chat widget mockup */}
        <rect
          x="285"
          y="150"
          width="215"
          height="95"
          rx="6"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <rect x="285" y="150" width="215" height="22" rx="6" fill="#0284c7" />
        <rect x="285" y="162" width="215" height="10" fill="#0284c7" />
        <circle cx="298" cy="161" r="5" fill="#38bdf8" />
        <text
          x="308"
          y="164"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          Live Chat with Patricia
        </text>
        {/* Chat bubbles */}
        <rect x="295" y="180" width="130" height="16" rx="4" fill="#f1f5f9" />
        <text x="301" y="191" fill="#334155" fontSize="7.5" fontFamily="sans-serif">
          Hi! Can I help you with pricing?
        </text>
        <rect x="350" y="202" width="140" height="16" rx="4" fill="#0284c7" />
        <text x="356" y="213" fill="#ffffff" fontSize="7.5" fontFamily="sans-serif">
          Yes, I need an Enterprise quote.
        </text>
        <line x1="285" y1="226" x2="500" y2="226" stroke="#f1f5f9" strokeWidth="1" />
        <text x="295" y="238" fill="#94a3b8" fontSize="7.5" fontFamily="sans-serif">
          Type a message...
        </text>
      </g>
    </svg>
  );
}
