"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Skill = { id: string; name: string };

export default function StudentSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) {
        setError("Your session could not be verified. Please sign in again.");
        setBusy(false);
        return;
      }
      const [skillsResult, selectedResult] = await Promise.all([
        supabase.from("skills").select("id,name").order("name"),
        supabase.from("student_skills").select("skill_id").eq("student_id", auth.user.id),
      ]);
      if (!active) return;
      if (skillsResult.error || selectedResult.error) {
        const cause = skillsResult.error ?? selectedResult.error;
        console.error("Student skills load failed:", cause);
        setError("Your skills could not be loaded. Please try again later.");
      } else {
        setSkills(skillsResult.data ?? []);
        setSelectedIds((selectedResult.data ?? []).map((row) => row.skill_id));
      }
      setBusy(false);
    })();
    return () => { active = false; };
  }, []);

  const selectedSkills = useMemo(() => skills.filter((skill) => selectedIds.includes(skill.id)), [skills, selectedIds]);
  const availableSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return skills.filter((skill) => !selectedIds.includes(skill.id) && skill.name.toLowerCase().includes(normalized));
  }, [query, selectedIds, skills]);

  async function updateSkill(skill: Skill, add: boolean) {
    setSavingId(skill.id);
    setError("");
    setNotice("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setError("Your session could not be verified. Please sign in again.");
      setSavingId("");
      return;
    }

    const result = add
      ? await supabase.from("student_skills").upsert({ student_id: auth.user.id, skill_id: skill.id, proficiency: "Beginner" }, { onConflict: "student_id,skill_id" })
      : await supabase.from("student_skills").delete().eq("student_id", auth.user.id).eq("skill_id", skill.id);
    if (result.error) {
      console.error(`Student skill ${add ? "add" : "delete"} failed:`, result.error);
      setError(`The skill could not be ${add ? "added" : "removed"}. Please try again.`);
      setSavingId("");
      return;
    }

    setSelectedIds((current) => add ? [...current, skill.id] : current.filter((id) => id !== skill.id));
    setNotice(add ? `${skill.name} added to your skills.` : `${skill.name} removed from your skills.`);
    setSavingId("");
  }

  return <div className="page-wrap-narrow space-y-6 py-8">
    <header>
      <p className="section-kicker">Student portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#122b55]">Your skills</h1>
      <p className="mt-2 text-sm text-slate-600">View and manage the skills on your postgraduate profile.</p>
    </header>
    {notice && <p role="status" className="status-panel" data-tone="success">{notice}</p>}
    {error && <p role="alert" className="status-panel" data-tone="error">{error}</p>}
    <section className="surface-card rounded-2xl p-5 sm:p-7" aria-labelledby="submitted-skills-heading">
      <h2 id="submitted-skills-heading" className="text-lg font-semibold text-[#122b55]">Submitted skills</h2>
      {busy ? <p role="status" className="mt-4 text-sm text-slate-600">Loading your skills...</p> : selectedSkills.length ? <ul className="mt-4 flex flex-wrap gap-2">{selectedSkills.map((skill) => <li key={skill.id} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-900">{skill.name}<button type="button" disabled={savingId === skill.id} onClick={() => void updateSkill(skill, false)} className="rounded-full px-1 text-blue-800 hover:bg-blue-100 disabled:opacity-50" aria-label={`Remove ${skill.name}`}>&times;</button></li>)}</ul> : <p className="mt-4 text-sm text-slate-600">No skills have been added to your profile yet.</p>}
    </section>
    <section className="surface-card rounded-2xl p-5 sm:p-7" aria-labelledby="add-skills-heading">
      <h2 id="add-skills-heading" className="text-lg font-semibold text-[#122b55]">Add a skill</h2>
      <label className="mt-4 block text-sm font-medium text-slate-700">Search available skills<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 w-full" placeholder="Search skills" /></label>
      {!busy && <ul className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto">{availableSkills.slice(0, 100).map((skill) => <li key={skill.id} className="flex items-center justify-between gap-4 py-2"><span className="text-sm text-slate-700">{skill.name}</span><button type="button" disabled={savingId === skill.id} onClick={() => void updateSkill(skill, true)} className="button-secondary !min-h-9 !px-3 !py-1 text-xs disabled:opacity-50">{savingId === skill.id ? "Saving..." : "Add"}</button></li>)}</ul>}
      {!busy && !availableSkills.length && <p className="mt-4 text-sm text-slate-500">No more matching skills are available.</p>}
    </section>
  </div>;
}
