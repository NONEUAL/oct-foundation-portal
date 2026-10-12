import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import octLogo from "../assets/oct-logo.png";

export default function ModeratorLogin() {
  const { sendMagicLink } = useAuth();
  const { pathname } = useLocation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isAdminPage = pathname.startsWith("/admin");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await sendMagicLink(email.trim(), isAdminPage ? "/admin" : "/moderator");
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen flex-col bg-mint">
      <div className="bg-gradient-to-br from-ink to-mid px-4 py-8">
        <div className="mx-auto flex max-w-sm items-center gap-3">
          <img src={octLogo} alt="Olivarez College – Tagaytay seal" className="h-14 w-14 rounded-full border-2 border-gold bg-ink" />
          <div>
            <p className="font-display text-3xl font-bold leading-none text-white">{isAdminPage ? "Admin" : "Moderator"}</p>
            <p className="mt-1 text-sm text-line">OCT Foundation Week</p>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-sm flex-1 px-4 py-6">
        {status === "sent" ? (
          <div role="status">
            <h1 className="font-display text-2xl font-bold text-ink">Check your email</h1>
            <p className="mt-2 text-sm">We sent a sign-in link to <b>{email}</b>. Open it on this device. If it has expired, come back and send a new one.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
            <p className="text-sm text-soft">Use the email you were invited with. We'll send a link, so there's no password to remember.</p>
            <label htmlFor="email" className="text-sm font-semibold">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@olivarez.edu.ph"
              className="min-h-12 rounded-xl border border-line bg-surface px-4 text-base focus:border-mid" />
            {status === "error" && <p role="alert" className="text-sm font-semibold text-live">{errorMessage}</p>}
            <button type="submit" disabled={status === "sending"} className="min-h-12 rounded-xl bg-gold font-bold text-ink disabled:opacity-50">
              {status === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">Back to the portal</Link>
      </div>
    </div>
  );
}
