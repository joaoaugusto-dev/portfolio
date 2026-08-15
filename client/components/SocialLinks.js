import { Mail, MessageCircle } from "lucide-react";

function GithubIcon({ size = 20, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.35-3.88-1.35-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.02 11.02 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A10.98 10.98 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon({ size = 20, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export const socials = [
  { href: "mailto:contato@joaoaugusto.dev", label: "Email", Icon: Mail },
  { href: "https://api.whatsapp.com/send?phone=5519994943031", label: "WhatsApp", Icon: MessageCircle },
  { href: "https://github.com/joaoaugusto-dev", label: "GitHub", Icon: GithubIcon },
  { href: "https://www.linkedin.com/in/jo%C3%A3o-augusto-de-freitas/", label: "LinkedIn", Icon: LinkedinIcon },
];

export default function SocialLinks({ className = "", large = false }) {
  return (
    <div className={`flex flex-wrap justify-center ${large ? "gap-4" : "gap-4"} ${className}`}>
      {socials.map(({ href, label, Icon }) =>
        large ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-surface py-3 pl-4 pr-5 text-muted transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:text-accent-2 hover:shadow-lg hover:shadow-accent/25"
          >
            <Icon size={22} className="text-accent-2 transition-colors group-hover:text-accent-2" />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </a>
        ) : (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface text-muted transition-all duration-300 hover:-translate-y-1.5 hover:border-accent hover:text-accent-2 hover:shadow-lg hover:shadow-accent/25"
          >
            <Icon size={20} />
            <span className="pointer-events-none absolute -top-8 rounded-md bg-surface-2 px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-all duration-200 group-hover:-top-9 group-hover:opacity-100">
              {label}
            </span>
          </a>
        ),
      )}
    </div>
  );
}
