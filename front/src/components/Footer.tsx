import { BrandLogo } from "@/components/BrandLogo";
import { instagramLink, type Settings } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div>
          <BrandLogo href="#topo" height={36} />
          <p>{settings.footer || siteCopy.footerFallback}</p>
        </div>
        {settings.instagram ? (
          <a href={instagramLink(settings.instagram)} target="_blank" rel="noreferrer">
            Instagram
          </a>
        ) : (
          <span>© {new Date().getFullYear()}</span>
        )}
      </div>
    </footer>
  );
}
