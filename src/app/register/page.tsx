"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { supabase } from "@/lib/supabase";
import { getStudentRegistration, registrationResumeStep } from "@/lib/student-registration";

type Draft = {
  firstName: string; middleName: string; lastName: string; email: string; phone: string;
  country: string; state: string; city: string; programme: string; degreeType: string;
  admissionYear: string; programmeStartDate: string; academicStatus: string; graduationDate: string;
  skills: string[]; noSideSkills: boolean; employmentStatus: string; currentEmployer: string; jobTitle: string;
  workCountry: string; workState: string; workCity: string; yearsExperience: string; careerInterest: string;
};
const DRAFT_KEY = "postgraduate-registration-draft";
const initial: Draft = {
  firstName: "", middleName: "", lastName: "", email: "", phone: "", country: "Nigeria", state: "", city: "",
  programme: "", degreeType: "", admissionYear: "", programmeStartDate: "", academicStatus: "In Progress", graduationDate: "",
  skills: [], noSideSkills: false, employmentStatus: "", currentEmployer: "", jobTitle: "Student", workCountry: "Nigeria", workState: "", workCity: "",
  yearsExperience: "", careerInterest: "",
};
type Row = { id: string; name: string };
type Programme = { id: string; degree_type: string };
type Location = { id: string; name: string; state_id?: string };
type Skill = { id: string; name: string; category_id?: string | null; category?: string };
const steps = ["Personal", "Academic", "Skills", "Career", "Review"];
const control = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus-visible:border-[#147d82] focus-visible:ring-4 focus-visible:ring-teal-100 disabled:bg-slate-100";
const motion = "transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200";

export default function RegisterPage() {
  const router = useRouter();
  const [data, setData] = useState<Draft>(initial);
  const [step, setStep] = useState(1);
  const [faculties, setFaculties] = useState<Row[]>([]);
  const [departments, setDepartments] = useState<Row[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [statuses, setStatuses] = useState<Row[]>([]);
  const [states, setStates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setField = (name: keyof Draft, value: string) => setData((old) => ({ ...old, [name]: value }));
  const report = (label: string, cause: unknown) => {
    console.error(`${label}:`, cause);
    setError(`${label} could not be loaded. Please refresh and try again.`);
  };

  useEffect(() => {
    const restored = window.localStorage.getItem(DRAFT_KEY);
    if (restored) {
      try {
        const parsed = JSON.parse(restored) as Partial<Draft> & { data?: Partial<Draft>; step?: number };
        const savedData = parsed.data ?? parsed;
        const noSideSkills = Boolean(savedData.noSideSkills);
        const safeDraft = { ...initial, ...savedData, skills: noSideSkills ? [] : Array.isArray(savedData.skills) ? savedData.skills : [], noSideSkills };
        setData(safeDraft);
        if (typeof parsed.step === "number" && parsed.step >= 2 && parsed.step <= 5) setStep(parsed.step);
      } catch (cause) { console.error("Could not restore registration draft:", cause); }
    }
    void (async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError && authError.name !== "AuthSessionMissingError") console.error("Could not check registration session:", authError);
      const confirmed = Boolean(authData.user?.email_confirmed_at);
      const params = new URLSearchParams(window.location.search);
      const resume = params.get("resume") === "1";
      if (resume && confirmed && authData.user) {
        try {
          const record = await getStudentRegistration(authData.user.id);
          const profile = record.profile ?? {};
          const academic = record.academic ?? {};
          const employment = record.employment ?? {};
          const saved = {
            ...initial,
            firstName: String(profile.first_name ?? authData.user.user_metadata?.first_name ?? ""),
            middleName: String(profile.middle_name ?? authData.user.user_metadata?.middle_name ?? ""),
            lastName: String(profile.last_name ?? authData.user.user_metadata?.last_name ?? ""),
            email: String(profile.email ?? authData.user.email ?? ""), phone: String(profile.phone ?? ""), country: String(profile.country ?? "Nigeria"), state: String(profile.state ?? ""), city: String(profile.city ?? ""),
            programme: String(academic.programme_id ?? ""), degreeType: String(academic.degree_type ?? ""), admissionYear: academic.admission_year ? String(academic.admission_year) : "", programmeStartDate: String(academic.programme_start_date ?? ""), academicStatus: String(academic.academic_status ?? "In Progress"), graduationDate: String(academic.graduation_date ?? "").slice(0, 7),
            skills: record.skills.map((skill) => skill.skill_id), noSideSkills: Boolean(record.preference?.no_side_skills),
            employmentStatus: String(employment.employment_status_id ?? ""), currentEmployer: String(employment.employer_name ?? ""), jobTitle: String(employment.job_title ?? "Student"), workCountry: String(employment.country ?? "Nigeria"), workState: "", workCity: "", yearsExperience: "", careerInterest: "",
          };
          setData(saved);
          setStep(registrationResumeStep(record) || 5);
          if (record.academic?.programme_id) {
            const { data: programme } = await supabase.from("programmes").select("id,degree_type,department_id").eq("id", String(record.academic.programme_id)).maybeSingle();
            if (programme) {
              setField("degreeType", programme.degree_type);
              setDepartmentId(programme.department_id);
              const { data: department } = await supabase.from("departments").select("id,name,faculty_id").eq("id", programme.department_id).maybeSingle();
              if (department) { setFacultyId(department.faculty_id); }
            }
          }
          if (employment.state) {
            const { data: state } = await supabase.from("states").select("id,name").eq("name", String(employment.state)).maybeSingle();
            if (state) { setData((old) => ({ ...old, workState: state.id }));
              const { data: city } = await supabase.from("cities").select("id,name,state_id").eq("name", String(employment.city ?? "")).eq("state_id", state.id).maybeSingle();
              if (city) setData((old) => ({ ...old, workCity: city.id }));
            }
          }
          setNotice("Your saved registration details have been restored.");
        } catch (cause) { console.error("Could not load saved registration:", cause); setError("Your saved registration could not be loaded. Please retry or contact the College."); }
      } else if (params.get("continue") === "1" && confirmed) {
        setStep(2); setNotice("Email verified. Continue your registration.");
      } else if (params.get("continue") === "1") {
        setError("Verify your email before continuing to Academic Information.");
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || submitted) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step }));
  }, [data, ready, submitted, step]);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      const tasks = await Promise.all([
        supabase.from("faculties").select("id,name").order("name"),
        supabase.from("employment_statuses").select("id,name").order("name"),
        supabase.from("states").select("id,name").eq("country", "Nigeria").order("name"),
        supabase.from("skills").select("id,name,category_id,skill_categories(name)").order("name"),
      ]);
      const [facultyResult, statusResult, stateResult, skillResult] = tasks;
      if (facultyResult.error) report("Faculties", facultyResult.error); else setFaculties(facultyResult.data ?? []);
      if (statusResult.error) report("Employment statuses", statusResult.error); else setStatuses(statusResult.data ?? []);
      if (stateResult.error) report("States", stateResult.error); else setStates(stateResult.data ?? []);
      if (skillResult.error) report("Skills", skillResult.error);
      else setSkills((skillResult.data ?? []).map((row) => {
        const rel = row.skill_categories as unknown as { name?: string } | { name?: string }[] | null;
        return { ...row, category: Array.isArray(rel) ? rel[0]?.name : rel?.name };
      }));
    })();
  }, [ready]);

  useEffect(() => {
    if (!facultyId) { setDepartments([]); return; }
    void (async () => {
      const { data: rows, error: cause } = await supabase.from("departments").select("id,name").eq("faculty_id", facultyId).order("name");
      if (cause) report("Departments", cause); else setDepartments(rows ?? []);
    })();
  }, [facultyId]);
  useEffect(() => {
    if (!departmentId) { setProgrammes([]); return; }
    void (async () => {
      const { data: rows, error: cause } = await supabase.from("programmes").select("id,degree_type").eq("department_id", departmentId).order("degree_type");
      if (cause) report("Programmes", cause); else setProgrammes(rows ?? []);
    })();
  }, [departmentId]);
  useEffect(() => {
    if (!data.workState) { setCities([]); return; }
    void (async () => {
      const { data: rows, error: cause } = await supabase.from("cities").select("id,name,state_id").eq("state_id", data.workState).order("name");
      if (cause) report("Cities", cause); else setCities(rows ?? []);
    })();
  }, [data.workState]);

  const selectedProgramme = programmes.find((item) => item.id === data.programme);
  const selectedStatus = statuses.find((item) => item.id === data.employmentStatus);
  const selectedFaculty = faculties.find((item) => item.id === facultyId);
  const selectedDepartment = departments.find((item) => item.id === departmentId);
  const graduationRequired = data.academicStatus === "Completed" || data.academicStatus === "Graduated";
  const groupedSkills = useMemo(() => {
    const matches = skills.filter((skill) => skill.name.toLowerCase().includes(skillQuery.toLowerCase()));
    const groupFor = (skill: Skill) => {
      const category = (skill.category ?? "").toLowerCase();
      if (category.includes("side")) return "Side Skills";
      if (category.includes("other")) return "Other Skills";
      return "Professional Skills";
    };
    return ["Professional Skills", "Side Skills", "Other Skills"].map((title) => ({ title, items: matches.filter((skill) => groupFor(skill) === title) }));
  }, [skills, skillQuery]);
  const academicReview: [string, string][] = [
    ["Faculty", selectedFaculty?.name ?? ""],
    ["Department", selectedDepartment?.name ?? ""],
    ["Programme / Degree", selectedProgramme?.degree_type ?? ""],
    ["Admission Year", data.admissionYear],
    ["Academic Status", data.academicStatus],
    ...(graduationRequired ? [["Graduation Date (Date of Senate Approval)", data.graduationDate ? new Date(`${data.graduationDate}-01T00:00:00`).toLocaleDateString("en", { month: "long", year: "numeric" }) : ""] as [string, string]] : []),
  ];

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const password = event.currentTarget.querySelector<HTMLInputElement>('input[name="password"]')!;
    const confirmPassword = event.currentTarget.querySelector<HTMLInputElement>('input[name="confirmPassword"]')!;
    if (password.value.length < 6 || password.value !== confirmPassword.value) { setError(password.value.length < 6 ? "Password must be at least 6 characters." : "Passwords do not match."); setLoading(false); return; }
    const safe = { ...data };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: safe, step: 2 }));
    const { error: cause } = await supabase.auth.signUp({ email: data.email.trim(), password: password.value, options: { data: { first_name: data.firstName.trim(), middle_name: data.middleName.trim(), last_name: data.lastName.trim() }, emailRedirectTo: `${window.location.origin}/register/verify` } });
    setLoading(false);
    if (cause) { console.error("Registration sign up failed:", cause); setError("We could not create your account. Check the email address or sign in if it is already registered."); return; }
    router.push(`/register/verify?email=${encodeURIComponent(data.email.trim())}`);
  }

  function go(next: number) {
    if (step === 1) { setError("Verify your email address before continuing."); return; }
    const bounded = Math.max(2, Math.min(5, next)); setStep(bounded); setError("");
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: bounded }));
  }
  function updateFaculty(value: string) { setFacultyId(value); setDepartmentId(""); setProgrammes([]); setField("programme", ""); setField("degreeType", ""); }
  function updateDepartment(value: string) { setDepartmentId(value); setProgrammes([]); setField("programme", ""); setField("degreeType", ""); }

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user?.email_confirmed_at) { setLoading(false); setError("Verify your email before submitting registration."); setStep(2); return; }
    const uid = user.id;
    const { error: profileError } = await supabase.from("student_profiles").upsert({ student_id: uid, first_name: data.firstName, middle_name: data.middleName || null, last_name: data.lastName, email: data.email, phone: data.phone, country: data.country, state: data.state, city: data.city }, { onConflict: "student_id" });
    if (profileError) { console.error("Profile save failed:", profileError); setError("Your profile could not be saved. Please check required details and try again."); setLoading(false); return; }
    const academic = { student_id: uid, programme_id: data.programme, degree_type: selectedProgramme?.degree_type ?? data.degreeType, admission_year: Number(data.admissionYear), programme_start_date: data.programmeStartDate, academic_status: data.academicStatus, graduation_date: graduationRequired && data.graduationDate ? `${data.graduationDate}-01` : null };
    const { data: academicRecord, error: academicLookupError } = await supabase.from("student_academic_records").select("id").eq("student_id", uid).limit(1).maybeSingle();
    if (academicLookupError) { console.error("Academic record lookup failed:", academicLookupError); setError("Academic details could not be saved. Please try again later."); setLoading(false); return; }
    const academicWrite = academicRecord?.id
      ? await supabase.from("student_academic_records").update(academic).eq("id", academicRecord.id)
      : await supabase.from("student_academic_records").insert(academic);
    const academicError = academicWrite.error;
    if (academicError) { console.error("Academic record save failed:", academicError); setError("Academic details could not be saved. Please confirm your programme and dates."); setLoading(false); return; }
    const { error: preferenceError } = await supabase.from("student_skill_preferences").upsert({ student_id: uid, no_side_skills: data.noSideSkills }, { onConflict: "student_id" });
    if (preferenceError) { console.error("Student skill preference save failed:", preferenceError); setError("Your profile and academic details were saved, but the skills choice could not be saved. Please try again."); setLoading(false); return; }
    const { data: savedSkills, error: savedSkillsError } = await supabase.from("student_skills").select("skill_id").eq("student_id", uid);
    if (savedSkillsError) { console.error("Student skills lookup failed:", savedSkillsError); setError("Your skills could not be updated. Please try again."); setLoading(false); return; }
    const selectedSkills = data.noSideSkills ? [] : data.skills;
    const staleSkillIds = (savedSkills ?? []).map((row) => row.skill_id).filter((skillId) => !selectedSkills.includes(skillId));
    if (staleSkillIds.length) {
      const { error: deleteSkillsError } = await supabase.from("student_skills").delete().eq("student_id", uid).in("skill_id", staleSkillIds);
      if (deleteSkillsError) { console.error("Student skills clear failed:", deleteSkillsError); setError("Your skills could not be updated. Please try again."); setLoading(false); return; }
    }
    if (selectedSkills.length) {
      const { error: skillsError } = await supabase.from("student_skills").upsert(selectedSkills.map((skill_id) => ({ student_id: uid, skill_id, proficiency: "Beginner" })), { onConflict: "student_id,skill_id" });
      if (skillsError) { console.error("Student skills save failed:", skillsError); setError("Your profile and academic details were saved, but skills could not be saved. Please try again."); setLoading(false); return; }
    }
    const employment = { student_id: uid, employment_status_id: data.employmentStatus, job_title: data.jobTitle.trim() || "Student", employer_name: data.currentEmployer || null, country: data.workCountry, state: states.find((item) => item.id === data.workState)?.name ?? null, city: cities.find((item) => item.id === data.workCity)?.name ?? null, is_current: true };
    const { data: currentEmployment, error: employmentLookupError } = await supabase.from("employment_history").select("id").eq("student_id", uid).eq("is_current", true).limit(1).maybeSingle();
    if (employmentLookupError) { console.error("Employment lookup failed:", employmentLookupError); setError("Your registration could not be saved. Please try again later."); setLoading(false); return; }
    const employmentWrite = currentEmployment?.id
      ? await supabase.from("employment_history").update(employment).eq("id", currentEmployment.id)
      : await supabase.from("employment_history").insert(employment);
    const employmentError = employmentWrite.error;
    if (employmentError) { console.error("Employment details save failed:", employmentError); setError("Your profile was saved, but employment details could not be saved. Please try again."); setLoading(false); return; }
    window.localStorage.removeItem(DRAFT_KEY); setLoading(false); setSubmitted(true); setNotice("Your registration has been saved successfully.");
  }

  const input = (label: string, name: keyof Draft, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="block text-sm font-medium text-slate-700">{label}{props.required && <span className="ml-1 text-red-500">*</span>}<input {...props} name={name} value={String(data[name])} onChange={(e) => setField(name, e.target.value)} className={`${control} mt-2`} /></label>;
  const select = (label: string, name: keyof Draft, options: { value: string; label: string }[], props: React.SelectHTMLAttributes<HTMLSelectElement> = {}) => <label className="block text-sm font-medium text-slate-700">{label}{props.required && <span className="ml-1 text-red-500">*</span>}<select {...props} name={name} value={String(data[name])} onChange={(e) => { const value = e.target.value; setField(name, value); if (name === "academicStatus" && value === "In Progress") setField("graduationDate", ""); }} className={`${control} mt-2`}><option value="">Select...</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;

  return <main id="main-content" className="min-h-screen text-slate-900"><InstitutionHeader brandTitle="Postgraduate Career Tracking"><Link href="/login" className="button-secondary">Student Login</Link></InstitutionHeader>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10"><div className="mb-7 rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-sm"><h2 className="font-semibold text-[#16265c]">Before you begin</h2><p className="mt-2 text-sm leading-6 text-slate-600">Complete the five sections below. Your registration draft is saved without your password while you verify your email.</p></div><h1 className="text-3xl font-bold tracking-tight text-[#16265c]">Postgraduate Career Registration</h1><p className="mt-2 text-slate-600">Create your career profile and stay connected with postgraduate opportunities.</p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">Step {step} of {steps.length}: {steps[step - 1]}</p><div className="registration-progress my-8 flex items-start"><div className="registration-progress-labels">{steps.map((item, index) => <span key={item} aria-current={step === index + 1 ? "step" : undefined} className={`progress-step-label ${index < step - 1 ? "is-complete" : index === step - 1 ? "is-current" : "is-upcoming"}`}>{index < step - 1 && <span aria-hidden="true">✓ </span>}{item}</span>)}</div><div role="progressbar" aria-label="Registration progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={step} aria-valuetext={`Step ${step} of ${steps.length}: ${steps[step - 1]}`} className="progress-track"><span className="progress-fill" style={{ width: `${step / steps.length * 100}%` }} /></div></div>
      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-900/5 sm:p-8">{error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
        {step === 1 && <form onSubmit={createAccount}><Heading title="Personal Information" description="Create your account first. We’ll ask you to verify your email before continuing."/><div className="grid gap-5 sm:grid-cols-2">{input("First Name", "firstName", { required: true })}{input("Middle Name", "middleName")}{input("Last Name", "lastName", { required: true })}{input("Email Address", "email", { type: "email", required: true })}{input("Phone / WhatsApp Number", "phone", { required: true })}{select("Country", "country", [{ value: "Nigeria", label: "Nigeria" }], { required: true })}{input("State", "state", { required: true })}{input("City", "city", { required: true })}<label className="block text-sm font-medium text-slate-700">Password<input name="password" type="password" minLength={6} required className={`${control} mt-2`} autoComplete="new-password"/></label><label className="block text-sm font-medium text-slate-700">Confirm Password<input name="confirmPassword" type="password" minLength={6} required className={`${control} mt-2`} autoComplete="new-password"/></label></div><div className="mt-8 flex justify-end"><button disabled={loading} className={`rounded-xl bg-[#16265c] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#101c48] disabled:opacity-60 ${motion}`}>{loading ? "Creating account…" : "Create Account & Verify Email"}</button></div></form>}
        {step === 2 && <><Heading title="Academic Information" description="Select your faculty, department, and programme in order."/><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Faculty<select className={`${control} mt-2`} value={facultyId} required onChange={(e) => updateFaculty(e.target.value)}><option value="">Select faculty</option>{faculties.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Department<select className={`${control} mt-2`} value={departmentId} required disabled={!facultyId} onChange={(e) => updateDepartment(e.target.value)}><option value="">{facultyId ? "Select department" : "Select faculty first"}</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Programme / Degree<select className={`${control} mt-2`} value={data.programme} required disabled={!departmentId} onChange={(e) => { const p = programmes.find((x) => x.id === e.target.value); setField("programme", e.target.value); setField("degreeType", p?.degree_type ?? ""); }}><option value="">{departmentId ? "Select programme" : "Select department first"}</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.degree_type}</option>)}</select></label>{input("Admission Year", "admissionYear", { type: "number", min: "1950", max: "2100", required: true })}{input("Programme Start Date", "programmeStartDate", { type: "date", required: true })}{select("Academic Status", "academicStatus", ["In Progress", "Completed", "Graduated"].map((x) => ({ value: x, label: x })), { required: true })}{graduationRequired && input("Graduation Date (Date of Senate Approval)", "graduationDate", { type: "month", required: true })}</div><Nav back={() => router.push("/register/verify")} next={() => { if (!selectedProgramme || !data.admissionYear || !data.programmeStartDate || !data.academicStatus || (graduationRequired && !data.graduationDate)) { setError("Complete the faculty, department, programme, admission year, start date, and applicable graduation date before continuing."); return; } go(3); }}/></>}
        {step === 3 && <><Heading title="Skills" description="Choose multiple skills from the existing database."/><label className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={data.noSideSkills} onChange={(event) => setData((old) => ({ ...old, noSideSkills: event.target.checked, skills: event.target.checked ? [] : old.skills }))}/>I have no side skills to add</label><input disabled={data.noSideSkills} className={control} placeholder="Search skills…" aria-label="Search skills" value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)}/><div className="mt-5 space-y-5">{groupedSkills.map((group) => <fieldset key={group.title} disabled={data.noSideSkills} className="rounded-2xl border border-slate-200 p-4 disabled:opacity-50"><legend className="px-2 font-semibold text-[#16265c]">{group.title}</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((skill) => <label key={skill.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-blue-50"><input type="checkbox" checked={data.skills.includes(skill.id)} onChange={(e) => setData((old) => ({ ...old, noSideSkills: false, skills: e.target.checked ? [...old.skills, skill.id] : old.skills.filter((id) => id !== skill.id) }))}/>{skill.name}</label>)}</div>{!group.items.length && <p className="text-sm text-slate-500">No skills found in this group.</p>}</fieldset>)}</div><Nav back={() => go(2)} next={() => go(4)}/></>}
        {step === 4 && <><Heading title="Career Information" description="Tell us about current employment and career interests."/><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Current Employment Status<select className={`${control} mt-2`} required value={data.employmentStatus} onChange={(e) => setField("employmentStatus", e.target.value)}><option value="">Select status</option>{statuses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>{input("Current Employer / Organization", "currentEmployer", { placeholder: "Leave blank if not applicable" })}{input("Current Job Title", "jobTitle", { placeholder: "Student" })}{select("Years of Work Experience", "yearsExperience", ["No experience", "Less than 1 year", "1–3 years", "4–6 years", "7–10 years", "More than 10 years"].map((x) => ({ value: x, label: x })))}<label className="text-sm font-medium text-slate-700">Work Country<select className={`${control} mt-2`} value="Nigeria" disabled><option>Nigeria</option></select></label><label className="text-sm font-medium text-slate-700">Work State<select className={`${control} mt-2`} required value={data.workState} onChange={(e) => { setField("workState", e.target.value); setField("workCity", ""); }}><option value="">Select state</option>{states.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Work City<select className={`${control} mt-2`} required disabled={!data.workState} value={data.workCity} onChange={(e) => setField("workCity", e.target.value)}><option value="">{data.workState ? "Select city" : "Select state first"}</option>{cities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Career Interests<textarea className={`${control} mt-2`} rows={3} value={data.careerInterest} onChange={(e) => setField("careerInterest", e.target.value)} placeholder="What opportunities interest you?"/></label></div><Nav back={() => go(3)} next={() => { if (!data.employmentStatus || !data.workState || !data.workCity) { setError("Select your employment status and work location."); return; } go(5); }}/></>}
        {step === 5 && <form onSubmit={submitRegistration}><Heading title="Review Your Information" description="Confirm the details below before saving your registration."/><Review title="Personal Information" items={[["Name", `${data.firstName} ${data.middleName} ${data.lastName}`], ["Email", data.email], ["Phone", data.phone], ["Location", `${data.city}, ${data.state}, ${data.country}`]]}/><Review title="Academic Information" items={academicReview}/><Review title="Skills" items={[["Selected skills", data.noSideSkills ? "No side skills" : skills.filter((s) => data.skills.includes(s.id)).map((s) => s.name).join(", ") || "Not provided"]]}/><Review title="Career Information" items={[["Employment Status", selectedStatus?.name ?? ""], ["Employer", data.currentEmployer || "Not applicable"], ["Job Title", data.jobTitle.trim() || "Student"], ["Work Location", `${cities.find((x) => x.id === data.workCity)?.name ?? ""}, ${states.find((x) => x.id === data.workState)?.name ?? ""}, Nigeria`], ["Experience", data.yearsExperience || "Not provided"], ["Career Interests", data.careerInterest || "Not provided"]]}/>{!submitted && <Nav back={() => go(4)} submit busy={loading}/>}</form>}
      </section><p className="mx-auto mt-5 max-w-5xl px-4 text-xs leading-5 text-slate-500">Your password is handled by Supabase Authentication and is never included in your saved registration draft.</p>
    </div><SiteFooter /></main>;
}

function Heading({ title, description }: { title: string; description: string }) { return <div className="mb-7"><h2 className="text-xl font-bold text-[#16265c]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>; }
function Nav({ back, next, submit = false, busy = false }: { back: () => void; next?: () => void; submit?: boolean; busy?: boolean }) { return <div className="mt-8 flex justify-between gap-4"><button type="button" onClick={back} className={`rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 ${motion}`}>Back</button>{submit ? <button disabled={busy} className={`rounded-xl bg-[#16265c] px-6 py-3 text-sm font-semibold text-white ${motion}`}>{busy ? "Saving…" : "Submit Registration"}</button> : <button type="button" onClick={next} className={`rounded-xl bg-[#16265c] px-6 py-3 text-sm font-semibold text-white ${motion}`}>Continue</button>}</div>; }
function Review({ title, items }: { title: string; items: [string, string][] }) { return <section className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5"><h3 className="mb-3 font-semibold text-[#16265c]">{title}</h3><dl className="space-y-2">{items.map(([key, value]) => <div key={key} className="grid gap-1 border-b border-slate-200 pb-2 last:border-0 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">{key}</dt><dd className="text-sm text-slate-800 sm:col-span-2">{value || "Not provided"}</dd></div>)}</dl></section>; }
