type IconName =
  | "capsule"
  | "drop"
  | "sun"
  | "heart"
  | "baby"
  | "care"
  | "thermo"
  | "spark"
  | "truck"
  | "store"
  | "shield"
  | "user"
  | "cart"
  | "search"
  | "menu"
  | "close"
  | "clock"
  | "document";

export function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
}: {
  name: IconName | string;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "capsule":
      return <svg {...common}><path d="M8.2 4.2a4.24 4.24 0 0 1 6 0l5.6 5.6a4.24 4.24 0 0 1-6 6l-5.6-5.6a4.24 4.24 0 0 1 0-6Z"/><path d="m10.8 12.8 4-4"/></svg>;
    case "drop":
      return <svg {...common}><path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z"/><path d="M9.5 15.5c.5 1 1.3 1.5 2.5 1.5"/></svg>;
    case "sun":
      return <svg {...common}><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></svg>;
    case "heart":
      return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
    case "baby":
      return <svg {...common}><circle cx="12" cy="13" r="7"/><path d="M9.4 12h.1M14.5 12h.1M9.5 15.5c1.5 1.2 3.5 1.2 5 0M12 6c0-2 1.2-3 3-3"/></svg>;
    case "care":
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>;
    case "thermo":
      return <svg {...common}><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 7v9"/></svg>;
    case "spark":
      return <svg {...common}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>;
    case "truck":
      return <svg {...common}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
    case "store":
      return <svg {...common}><path d="M4 10v10h16V10M3 10l2-6h14l2 6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6"/></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "cart":
      return <svg {...common}><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
    case "menu":
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case "close":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "document":
      return <svg {...common}><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="44" rx="12" fill="#00874E" />
        {/* Blue heart contour from physical sign */}
        <path
          d="M22 35C22 35 34 27 34 18C34 13 30 9.5 25.5 9.5C23.2 9.5 22.3 10.6 22 11.2C21.7 10.6 20.8 9.5 18.5 9.5C14 9.5 10 13 10 18C10 27 22 35 22 35Z"
          stroke="#38BDF8"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Pharmacy Cross in Clean White */}
        <rect x="19.5" y="14" width="5" height="16" rx="2.5" fill="#FFFFFF" />
        <rect x="14" y="19.5" width="16" height="5" rx="2.5" fill="#FFFFFF" />
        {/* Yellow center dot from wall */}
        <circle cx="22" cy="22" r="2.5" fill="#FFCB05" />
      </svg>
    </span>
  );
}
