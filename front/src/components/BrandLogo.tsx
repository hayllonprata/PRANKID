import { siteCopy } from "@/lib/site-copy";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  height?: number;
  showTagline?: boolean;
};

export function BrandLogo({ href = "/", className = "", height = 44, showTagline = true }: BrandLogoProps) {
  const tagline = siteCopy.sloganEn.toUpperCase();
  const label = showTagline ? `PRANKID. ${siteCopy.sloganEn}` : "PRANKID";
  const body = (
    <>
      <img className="logo-img" src="/logo.webp" alt="" style={{ height }} />
      {showTagline ? (
        <span className="logo-tagline" aria-hidden="true">
          {Array.from(tagline).map((char, index) => (
            <span key={`${char}-${index}`}>{char === " " ? "\u00a0" : char}</span>
          ))}
        </span>
      ) : null}
    </>
  );

  if (href === null) {
    return (
      <span className={`logo ${className}`.trim()} aria-label={label}>
        {body}
      </span>
    );
  }

  return (
    <a className={`logo ${className}`.trim()} href={href} aria-label={label}>
      {body}
    </a>
  );
}
