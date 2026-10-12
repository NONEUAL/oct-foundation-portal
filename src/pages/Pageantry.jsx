import { useEffect, useState } from "react";
import { supabase, getActiveEdition } from "../lib/supabaseClient";
import { Splash, ErrorNote } from "../components/Shell";

export default function Pageantry() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [departmentLookup, setDepartmentLookup] = useState({});

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);

      const edition = await getActiveEdition();
      if (!edition) {
        if (!isCancelled) {
          setErrorMessage("No active Foundation Week edition is set.");
          setLoading(false);
        }
        return;
      }

      const [candidatesResult, deptsResult] = await Promise.all([
        supabase
          .from("candidates")
          .select("*")
          .eq("edition_id", edition.id),
        supabase.from("departments").select("*"),
      ]);

      if (isCancelled) return;

      if (candidatesResult.error) {
        setErrorMessage(candidatesResult.error.message);
        setLoading(false);
        return;
      }

      const deptLookup = {};
      (deptsResult.data || []).forEach((d) => (deptLookup[d.id] = d));

      setCandidates(candidatesResult.data || []);
      setDepartmentLookup(deptLookup);
      setLoading(false);
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) return <Splash>Loading…</Splash>;
  if (errorMessage) return <ErrorNote message={errorMessage} />;
  if (candidates.length === 0) return <Splash>No MMOCT candidates added for this edition yet.</Splash>;

  return (
    <div className="px-4 pb-6">
      <h2 className="font-display text-3xl font-bold text-ink">Pageantry</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((c) => (
          <article key={c.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              {c.photo_url ? (
                <img src={c.photo_url} alt="" className="h-14 w-14 rounded-full border-2 border-gold object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-hover font-display text-xl font-bold text-forest" aria-hidden="true">
                  {c.name?.[0]}
                </span>
              )}
              <div className="min-w-0">
                <h3 className="font-bold leading-snug">{c.name}</h3>
                <p className="text-sm text-soft">{departmentLookup[c.department_id]?.name ?? ""}</p>
              </div>
            </div>
            {c.bio && <p className="mt-3 text-sm leading-relaxed">{c.bio}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
