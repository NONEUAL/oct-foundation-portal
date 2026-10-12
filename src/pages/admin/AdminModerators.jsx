import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";

const select = "min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-base focus:border-mid";

export default function AdminModerators({ edition, departments }) {
  const { sendMagicLink } = useAuth();
  const deptList = Object.values(departments);
  const [mods, setMods] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [deptId, setDeptId] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([
      supabase.from("moderators").select("id, user_id, email, department_id, can_declare_winners").eq("edition_id", edition.id),
      supabase.from("moderator_invites").select("*").is("claimed_at", null).order("created_at", { ascending: false }),
    ]);
    setMods(m.data || []);
    setInvites(i.data || []);
  }, [edition.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggle(row) {
    const { error } = await supabase.from("moderators").update({ can_declare_winners: !row.can_declare_winners }).eq("id", row.id);
    if (error) setMsg({ ok: false, text: error.message });
    load();
  }

  async function invite(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const clean = email.trim().toLowerCase();
    const { error } = await supabase.from("moderator_invites").insert({ email: clean, department_id: deptId });
    if (error) {
      setBusy(false);
      setMsg({ ok: false, text: error.code === "23505" ? "That email already has an open invite." : error.message });
      return;
    }
    // The sign-in link doubles as the invite: signing in claims it.
    const { error: mailError } = await sendMagicLink(clean, "/moderator");
    setBusy(false);
    setEmail("");
    setMsg({ ok: !mailError, text: mailError ? `Invite saved, but the email failed: ${mailError.message}. They can still sign in at /moderator.` : "Invite sent." });
    load();
  }

  async function cancelInvite(id) {
    await supabase.from("moderator_invites").delete().eq("id", id);
    load();
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold text-ink">Moderators</h1>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-xl font-bold text-ink">Who can do what</h2>
        <dl className="mt-2 grid gap-3 text-sm md:grid-cols-3">
          <div><dt className="font-bold">Visitor</dt><dd>Views schedule, scores and brackets, and picks who they want to win. Picks never change results.</dd></div>
          <div><dt className="font-bold">Moderator</dt><dd>Enters scores for their department's matches. Can declare winners only if you switch that on.</dd></div>
          <div><dt className="font-bold">Admin</dt><dd>Builds brackets, declares or undoes any winner, manages moderators.</dd></div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section className="flex flex-col gap-3">
          {mods.length === 0 && <p className="text-sm text-soft">No moderators yet for this edition.</p>}
          {mods.map((m) => (
            <article key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{m.email ?? `User ${m.user_id.slice(0, 8)}`}</p>
                <p className="text-sm text-soft">{departments[m.department_id]?.code} · {departments[m.department_id]?.name}</p>
              </div>
              <label className="flex flex-shrink-0 items-center gap-2 text-sm font-semibold">
                Can declare winners
                <button type="button" role="switch" aria-checked={m.can_declare_winners} onClick={() => toggle(m)}
                  className={`h-8 w-14 rounded-full p-1 transition-colors ${m.can_declare_winners ? "bg-mid" : "bg-line"}`}>
                  <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${m.can_declare_winners ? "translate-x-6" : ""}`} />
                </button>
              </label>
            </article>
          ))}
          {invites.map((i) => (
            <article key={i.id} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-tint p-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{i.email}</p>
                <p className="text-sm text-soft">{departments[i.department_id]?.code} · Invite sent</p>
              </div>
              <button onClick={() => cancelInvite(i.id)} className="min-h-11 rounded-xl border border-line px-3 text-sm font-semibold text-forest">Cancel</button>
            </article>
          ))}
        </section>

        <form onSubmit={invite} className="flex h-fit flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-display text-xl font-bold text-ink">Invite a moderator</h2>
          <label className="flex flex-col gap-1 text-sm font-semibold">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.example" className={select} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Department
            <select required value={deptId} onChange={(e) => setDeptId(e.target.value)} className={select}>
              <option value="">Choose…</option>
              {deptList.map((d) => <option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}
            </select>
          </label>
          <button disabled={busy} className="min-h-12 rounded-xl bg-gold font-bold text-ink disabled:opacity-50">{busy ? "Sending…" : "Send invite"}</button>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-soft" : "text-live"}`}>{msg.text}</p>}
        </form>
      </div>
    </div>
  );
}
