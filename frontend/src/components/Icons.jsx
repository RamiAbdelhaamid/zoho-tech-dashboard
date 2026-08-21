// Minimal stroke-icon set (no emoji) keeps the UI consistent and formal.
const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function SunIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function RefreshIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 0 0-14.3-4.9M4 5v5h5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9M20 19v-5h-5" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.5 4.3-5.5 7.5-5.5s6.1 2 7.5 5.5" />
    </svg>
  );
}

export function TicketIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M10 6v12" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

export function TeamIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.8 19c1.1-3.2 3.3-4.9 5.7-4.9s4.6 1.7 5.7 4.9M14.8 19c.6-2.4 2-3.9 3.9-3.9s3.3 1.5 3.9 3.9" />
    </svg>
  );
}

export function ToolIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
    </svg>
  );
}

export function AlertIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2a5 5 0 0 0-5 5c0 3.2 5 12 5 12s5-8.8 5-12a5 5 0 0 0-5-5Z" />
      <circle cx="12" cy="7" r="1.8" />
    </svg>
  );
}

export function PlayIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5 10 17l9-10.5" />
    </svg>
  );
}

export function UndoIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 7 4 11l4 4" />
      <path d="M4 11h11a5 5 0 0 1 0 10h-2" />
    </svg>
  );
}

export function CopyIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 8.5V6a2 2 0 0 0-2-2H5.5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function MessageIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 5.5h15v10h-8L7 19v-3.5H4.5v-10Z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  );
}

export function PaperclipIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m20 11.5-8.5 8.5a5 5 0 0 1-7-7L14 3.5a3.4 3.4 0 0 1 4.8 4.8l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.3-8.3" />
    </svg>
  );
}

export function ExternalLinkIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h6v6" />
      <path d="m10 14 10-10" />
      <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function SpinnerIcon(props) {
  return (
    <svg {...base} {...props} className={`animate-spin ${props.className || ""}`}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
