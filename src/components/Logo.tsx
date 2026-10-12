/** Official PRAMIZAN pillar mark. */
export function Logo({ className = 'logo' }: { className?: string }) {
  return (
    <svg className={className} viewBox="25 14 50 74" aria-hidden="true">
      <path className="logo-pillar" d="M47 30V88H37A12 12 0 0 1 25 76V42A12 12 0 0 1 37 30Z" />
      <path className="logo-arc" d="M51 14A24 24 0 0 1 51 62Z" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <>
      <Logo />
      <span className="wordmark-name"><strong>PRAMIZAN</strong></span>
    </>
  )
}
