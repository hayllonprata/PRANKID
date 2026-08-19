import { siteCopy } from "@/lib/site-copy";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  height?: number;
};

export function BrandLogo({ href = "/", className = "", height = 44 }: BrandLogoProps) {
  const tagline = siteCopy.sloganEn.toUpperCase();
  const body = (
    <>
      <img className="logo-img" src="/logo.webp" alt="" style={{ height }} />
      <span className="logo-tagline" aria-hidden="true">
        {Array.from(tagline).map((char, index) => (
          <span key={`${char}-${index}`}>{char === " " ? "\u00a0" : char}</span>
        ))}
      </span>
    </>
  );

  if (href === null) {
    return (
      <span className={`logo ${className}`.trim()} aria-label={`PRANKID. ${siteCopy.sloganEn}`}>
        {body}
      </span>
    );
  }

  return (
    <a className={`logo ${className}`.trim()} href={href} aria-label={`PRANKID. ${siteCopy.sloganEn}`}>
      {body}
    </a>
  );
}
