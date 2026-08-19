import { instagramLink, type Settings } from "@/lib/api";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div>
          <strong>PRANKID</strong>
          <p>{settings.footer || "Toy art feita pra bagunçar o sério."}</p>
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
