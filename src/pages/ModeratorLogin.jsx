import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function ModeratorLogin() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await sendMagicLink(email.trim());
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-court px-4">
        <div className="max-w-sm text-center">
          <p className="font-mono text-xs tracking-wide text-scoreboard">
            CHECK YOUR EMAIL
          </p>
          <p className="mt-3 font-display text-lg text-chalk">
            Link sent to {email}
          </p>
          <p className="mt-2 text-sm text-mute">
            Open it on this device to sign in. It expires after a while, so
            if it's been a bit, come back and send a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-court px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <p className="font-mono text-xs tracking-wide text-mute">
          MODERATOR ACCESS
        </p>
        <h1 className="mt-2 font-display text-xl text-chalk">
          Sign in to update scores
        </h1>
        <p className="mt-2 text-sm text-mute">
          Use the email your department was registered with. We'll send a
          sign-in link — no password to remember.
        </p>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@olivarez.edu.ph"
          className="mt-6 w-full rounded border border-line bg-court-light px-3 py-2 text-sm text-chalk placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-scoreboard"
        />

        {status === "error" && (
          <p className="mt-2 text-sm text-scoreboard">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-4 w-full rounded bg-scoreboard py-2 font-mono text-xs tracking-wide text-court disabled:opacity-50"
        >
          {status === "sending" ? "SENDING…" : "SEND SIGN-IN LINK"}
        </button>
      </form>
    </div>
  );
}
