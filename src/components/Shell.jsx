import octLogo from "../assets/oct-logo.png";

export function Splash({ children }) {
  return <div className="p-8 text-sm font-semibold text-soft">{children}</div>;
}
export function ErrorNote({ message }) {
  return (
    <div className="p-6" role="alert">
      <p className="font-display text-xl font-bold text-live">Something's off.</p>
      <p className="mt-1 text-sm text-soft">{message}</p>
    </div>
  );
}

export function Brand({ subtitle = "Foundation Week" }) {
  return (
    <div className="flex items-center gap-3">
      <img src={octLogo} alt="Olivarez College – Tagaytay seal" className="h-11 w-11 flex-shrink-0 rounded-full border-2 border-gold bg-ink" />
      <div>
        <div className="font-display text-2xl font-bold leading-none tracking-wide text-white">OCT</div>
        <div className="mt-1 text-xs text-line">{subtitle}</div>
      </div>
    </div>
  );
}

export function HeaderBar({ children }) {
  return (
    <header className="bg-gradient-to-br from-ink to-mid px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">{children}</div>
    </header>
  );
}
