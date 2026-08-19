import { BrandLogo } from "@/components/BrandLogo";
import { instagramLink, type Settings } from "@/lib/api";

const DEFAULT_INSTAGRAM = "https://www.instagram.com/prankid_world/";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Footer({ settings }: { settings: Settings }) {
  const href = instagramLink(settings.instagram) || DEFAULT_INSTAGRAM;

  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div>
          <BrandLogo href="#topo" height={36} />
        </div>
        <div className="footer-social">
          <a
            className="ig-btn"
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram PRANKID"
          >
            <InstagramIcon />
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
