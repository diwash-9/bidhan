interface LogoProps {
  className?: string
}

/** Nepal-flag-inspired brand mark shared by the header and auth screens. */
export default function Logo({ className = 'w-9 h-9' }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 3h15.8l-4 4.6 4 4.6H4V3z"
        fill="#dc143c"
        stroke="#1e2f89"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4 12.8h12l-6 7.4-6-7.4z"
        fill="#dc143c"
        stroke="#1e2f89"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g transform="translate(11.6 5.4) scale(0.62)">
        <circle cx="3" cy="2.5" r="2.1" fill="#fff" />
        <path d="M2 0.6a2.4 2.4 0 0 0 0 3.8 1.9 1.9 0 0 1 0-3.8z" fill="#dc143c" />
      </g>
      <g transform="translate(10.2 13.6) scale(0.62)">
        <circle cx="2.6" cy="2.6" r="2.2" fill="#fff" />
        <path d="M1.8 1a2.6 2.6 0 0 0 0 3.2 2 2 0 0 1 0-3.2z" fill="#dc143c" />
      </g>
    </svg>
  )
}
