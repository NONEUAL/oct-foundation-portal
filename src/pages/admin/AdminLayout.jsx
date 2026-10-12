import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { useTournament } from "../../lib/useTournament";
import { Brand, HeaderBar, Splash, ErrorNote } from "../../components/Shell";
import AdminBracket from "./AdminBracket";
import AdminWinners from "./AdminWinners";
import AdminModerators from "./AdminModerators";

const SECTIONS = [
  ["bracket", "Bracket maker"],
  ["winners", "Winners"],
  ["moderators", "Moderators"],
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const data = useTournament();
  const [section, setSection] = useState("bracket");

  return (
    <div className="min-h-screen bg-mint">
      <HeaderBar>
        <Brand subtitle={user.email} />
        <div className="flex gap-2">
          <Link to="/moderator" className="hidden min-h-11 items-center rounded-xl border border-line/50 px-4 text-sm font-semibold text-white hover:bg-white/10 sm:flex">Scores</Link>
          <button onClick={signOut} className="min-h-11 rounded-xl border border-line/50 px-4 text-sm font-semibold text-white hover:bg-white/10">Sign out</button>
        </div>
      </HeaderBar>

      <div className="mx-auto max-w-7xl lg:flex lg:gap-6 lg:px-6 lg:py-6">
        <nav aria-label="Admin sections" className="flex gap-1 p-4 lg:sticky lg:top-6 lg:h-fit lg:w-56 lg:flex-shrink-0 lg:flex-col lg:p-0">
          <div className="flex w-full gap-1 rounded-2xl bg-hover p-1 lg:flex-col lg:bg-transparent lg:p-0">
            {SECTIONS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                aria-current={section === id ? "page" : undefined}
                className={`min-h-12 flex-1 rounded-xl px-3 font-semibold lg:flex-none lg:text-left ${section === id ? "bg-forest text-white" : "text-forest lg:hover:bg-hover"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1 px-4 pb-10 lg:px-0 lg:pb-0">
          {data.loading ? <Splash>Loading…</Splash> : data.error ? <ErrorNote message={data.error} /> : (
            <>
              {section === "bracket" && <AdminBracket {...data} />}
              {section === "winners" && <AdminWinners {...data} />}
              {section === "moderators" && <AdminModerators {...data} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
