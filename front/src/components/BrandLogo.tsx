type BrandLogoProps = {
  href?: string;
  className?: string;
  height?: number;
};

export function BrandLogo({ href = "/", className = "", height = 44 }: BrandLogoProps) {
  const image = (
    <img className="logo-img" src="/logo.webp" alt="PRANKID" style={{ height }} />
  );

  if (!href) {
    return <span className={`logo ${className}`.trim()}>{image}</span>;
  }

  return (
    <a className={`logo ${className}`.trim()} href={href} aria-label="PRANKID">
      {image}
    </a>
  );
}
