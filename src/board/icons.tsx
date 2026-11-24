import type { ReactNode } from "react";

/** Small line icons, drawn on a 16px grid in the current text colour. Decorative: buttons carry the names. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const ChevronLeft = () => <Icon><path d="M10 3.5 5.5 8l4.5 4.5" /></Icon>;
export const ChevronRight = () => <Icon><path d="M6 3.5 10.5 8 6 12.5" /></Icon>;
export const DoubleChevronLeft = () => <Icon><path d="M8 3.5 3.5 8 8 12.5M12.5 3.5 8 8l4.5 4.5" /></Icon>;
export const DoubleChevronRight = () => <Icon><path d="M3.5 3.5 8 8l-4.5 4.5M8 3.5 12.5 8 8 12.5" /></Icon>;
export const MoreVertical = () => (
  <Icon>
    <circle cx="8" cy="3.5" r="0.6" fill="currentColor" />
    <circle cx="8" cy="8" r="0.6" fill="currentColor" />
    <circle cx="8" cy="12.5" r="0.6" fill="currentColor" />
  </Icon>
);
export const Search = () => <Icon><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></Icon>;
export const Sun = () => (
  <Icon>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
  </Icon>
);
export const Moon = () => <Icon><path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4.5 4.5 0 0 0 7 7Z" /></Icon>;

/** The mark: an indigo square ruled with three Lines, like notebook paper. */
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg className="logo__mark" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect width="20" height="20" rx="5" fill="var(--accent)" />
      <path d="M5 7h10M5 10.5h10M5 14h6" stroke="var(--accent-contrast)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** The mark next to the wordmark "Munus Vitae". */
export function Logo() {
  return (
    <span className="logo" role="img" aria-label="Munus Vitae">
      <LogoMark />
      <span className="logo__wordmark" aria-hidden="true">
        Munus Vitae
      </span>
    </span>
  );
}
