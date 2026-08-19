import { whatsappLink } from "@/lib/api";

export function WhatsAppButton({ number }: { number: string }) {
  const href = whatsappLink(number);
  if (!href) return null;
  return (
    <a className="wa" href={href} target="_blank" rel="noreferrer" aria-label="WhatsApp de atendimento">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 3.5A11 11 0 0 0 2.1 16.7L1 23l6.5-1.1A11 11 0 0 0 20.5 3.5zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.9.7.7-3.8-.2-.3A9 9 0 1 1 12 21.5zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3s-1 1-1 2.4 1 2.8 1.2 3 .2.3 2 3.2a13.5 13.5 0 0 0 4.2 2.4c.4.1 1.1.2 1.6.1s1.5-.6 1.7-1.2.2-1.1.1-1.2-.3-.2-.6-.3z" />
      </svg>
    </a>
  );
}
