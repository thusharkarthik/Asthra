import { cn } from "@/lib/utils";

type AsthraLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
};

export function AsthraLogo({ className, markClassName, showWordmark = false, subtitle }: AsthraLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        aria-hidden="true"
        className={cn("h-9 w-9 shrink-0 rounded-xl shadow-sm", markClassName)}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="128" height="128" rx="16" fill="url(#asthra-logo-gradient)" />
        <path
          d="M26 72V20H76M40 90V38H58V56H46M46 56V90H92V40H76V70H58"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M102 64V108H64"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="asthra-logo-gradient" x1="12" y1="6" x2="118" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#05AFC4" />
            <stop offset="1" stopColor="#007B8E" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark ? (
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-semibold">Asthra</span>
          {subtitle ? <span className="block text-[11px] text-muted-foreground dark:text-white/55">{subtitle}</span> : null}
        </span>
      ) : null}
    </div>
  );
}
