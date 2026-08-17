export default function SocialLinks({ className = "", large = false, items = [] }) {
  return (
    <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
      {items.map(({ id, href, label, icon }) =>
        large ? (
          <a
            key={id ?? href ?? label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-surface py-3 pl-4 pr-5 text-muted transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:text-accent-2 hover:shadow-lg hover:shadow-accent/25"
          >
            <i className={`${icon} text-[1.375rem] text-accent-2`} aria-hidden />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </a>
        ) : (
          <a
            key={id ?? href ?? label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface text-muted transition-all duration-300 hover:-translate-y-1.5 hover:border-accent hover:text-accent-2 hover:shadow-lg hover:shadow-accent/25"
          >
            <i className={`${icon} text-lg`} aria-hidden />
            <span className="pointer-events-none absolute -top-8 rounded-md bg-surface-2 px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-all duration-200 group-hover:-top-9 group-hover:opacity-100">
              {label}
            </span>
          </a>
        ),
      )}
    </div>
  );
}
