import { siteCopy } from "@/lib/site-copy";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  height?: number;
};

export function BrandLogo({ href = "/", className = "", height = 44 }: BrandLogoProps) {
  const body = (
    <>
      <img className="logo-img" src="/logo.webp" alt="PRANKID" style={{ height }} />
      <span className="logo-tagline">{siteCopy.sloganEn}</span>
    </>
  );

  if (href === null) {
    return <span className={`logo ${className}`.trim()}>{body}</span>;
  }

  return (
    <a className={`logo ${className}`.trim()} href={href} aria-label="PRANKID">
      {body}
    </a>
  );
}
