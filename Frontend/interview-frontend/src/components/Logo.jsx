export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#e8b45a"/>
      <path d="M7 23 L11 10 L16 17.5 L21 10 L25 23" stroke="#0a0b0f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="25.5" r="1.8" fill="#0a0b0f"/>
    </svg>
  )
}