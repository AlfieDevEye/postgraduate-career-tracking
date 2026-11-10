"use client";

import { useEffect, useState } from "react";
import { getStudentRegistration, type StudentRegistration } from "@/lib/student-registration";
import { supabase } from "@/lib/supabase";

type Option = { id: string; name: string };
type Programme = { id: string; degree_type: string };
type ProfileForm = {
  firstName: string; middleName: string; lastName: string; phone: string; country: string; state: string; city: string;
  facultyId: string; departmentId: string; programmeId: string; admissionYear: string; programmeStartDate: string; academicStatus: string; graduationDate: string;
  employmentStatusId: string; employer: string; jobTitle: string; workState: string; workCity: string;
};
const emptyForm: ProfileForm = {
  firstName: "", middleName: "", lastName: "", phone: "", country: "Nigeria", state: "", city: "",
  facultyId: "", departmentId: "", programmeId: "", admissionYear: "", programmeStartDate: "", academicStatus: "In Progress", graduationDate: "",
  employmentStatusId: "", employer: "", jobTitle: "Student", workState: "", workCity: "",
};
const fieldClass = "mt-1 w-full";
const fieldLabel = "block text-sm font-medium text-slate-700";
const read = (record: Record<string, unknown> | null, key: string) => String(record?.[key] ?? "");

export default function StudentSettingsPage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [record, setRecord] = useState<StudentRegistration | null>(null);
  const [userId, setUserId] = useState("");
  const [faculties, setFaculties] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [employmentStatuses, setEmploymentStatuses] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletionPending, setDeletionPending] = useState(false);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) {
        setError("Your session could not be verified. Please sign in again.");
        setBusy(false);
        return;
      }
      try {
        const [student, facultyResult, statusResult, stateResult] = await Promise.all([
          getStudentRegistration(auth.user.id),
          supabase.from("faculties").select("id,name").order("name"),
          supabase.from("employment_statuses").select("id,name").order("name"),
          supabase.from("states").select("id,name").eq("country", "Nigeria").order("name"),
        ]);
        if (facultyResult.error || statusResult.error || stateResult.error) throw facultyResult.error ?? statusResult.error ?? stateResult.error;
        const academic = student.academic;
        const employment = student.employment;
        let facultyId = "";
        let departmentId = "";
        if (academic?.programme_id) {
          const { data: programme, error: programmeError } = await supabase.from("programmes").select("id,degree_type,department_id").eq("id", String(academic.programme_id)).maybeSingle();
          if (programmeError) throw programmeError;
          if (programme) {
            departmentId = programme.department_id;
            const { data: department, error: departmentError } = await supabase.from("departments").select("id,name,faculty_id").eq("id", departmentId).maybeSingle();
            if (departmentError) throw departmentError;
            facultyId = department?.faculty_id ?? "";
          }
        }
        if (!active) return;
        setUserId(auth.user.id);
        setRecord(student);
        const { data: deletionRequest, error: deletionError } = await supabase.from("student_profile_deletion_requests").select("id").eq("student_id", auth.user.id).eq("status", "pending").maybeSingle();
        if (deletionError) console.error("Profile deletion request status could not be loaded:", deletionError);
        else setDeletionPending(Boolean(deletionRequest));
        setFaculties(facultyResult.data ?? []);
        setEmploymentStatuses(statusResult.data ?? []);
        setStates(stateResult.data ?? []);
        setForm({
          ...emptyForm,
          firstName: read(student.profile, "first_name"),
          middleName: read(student.profile, "middle_name"),
          lastName: read(student.profile, "last_name"),
          phone: read(student.profile, "phone"),
          country: read(student.profile, "country") || "Nigeria",
          state: read(student.profile, "state"),
          city: read(student.profile, "city"),
          facultyId,
          departmentId,
          programmeId: read(academic, "programme_id"),
          admissionYear: read(academic, "admission_year"),
          programmeStartDate: read(academic, "programme_start_date").slice(0, 10),
          academicStatus: read(academic, "academic_status") || "In Progress",
          graduationDate: read(academic, "graduation_date").slice(0, 7),
          employmentStatusId: read(employment, "employment_status_id"),
          employer: read(employment, "employer_name"),
          jobTitle: read(employment, "job_title") || "Student",
          workState: read(employment, "state"),
          workCity: read(employment, "city"),
        });
      } catch (cause) {
        console.error("Student profile settings load failed:", cause);
        if (active) setError("Your profile details could not be loaded. Please try again later.");
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!form.facultyId) return;
    void (async () => {
      const { data, error: cause } = await supabase.from("departments").select("id,name").eq("faculty_id", form.facultyId).order("name");
      if (cause) { console.error("Student departments load failed:", cause); setError("Departments could not be loaded."); }
      else setDepartments(data ?? []);
    })();
  }, [form.facultyId]);

  useEffect(() => {
    if (!form.departmentId) return;
    void (async () => {
      const { data, error: cause } = await supabase.from("programmes").select("id,degree_type").eq("department_id", form.departmentId).order("degree_type");
      if (cause) { console.error("Student programmes load failed:", cause); setError("Programmes could not be loaded."); }
      else setProgrammes(data ?? []);
    })();
  }, [form.departmentId]);

  const workState = states.find((item) => item.name === form.workState);
  const workStateId = workState?.id;
  useEffect(() => {
    if (!workStateId) return;
    void (async () => {
      const { data, error: cause } = await supabase.from("cities").select("id,name,state_id").eq("state_id", workStateId).order("name");
      if (cause) { console.error("Student cities load failed:", cause); setError("Cities could not be loaded."); }
      else setCities(data ?? []);
    })();
  }, [workStateId]);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record?.profile || !record.academic || !record.employment) {
      setError("Your profile is incomplete. Contact the College for help updating these records.");
      return;
    }
    const programme = programmes.find((item) => item.id === form.programmeId);
    if (!programme) {
      setError("Select a programme before saving your academic details.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");

    const profileResult = await supabase.from("student_profiles").update({
      first_name: form.firstName.trim(),
      middle_name: form.middleName.trim() || null,
      last_name: form.lastName.trim(),
      phone: form.phone.trim(),
      country: form.country,
      state: form.state,
      city: form.city.trim(),
    }).eq("student_id", userId);
    if (profileResult.error) {
      console.error("Student profile update failed:", profileResult.error);
      setError("Personal details could not be saved.");
      setSaving(false);
      return;
    }

    const academicResult = await supabase.from("student_academic_records").update({
      programme_id: programme.id,
      degree_type: programme.degree_type,
      admission_year: Number(form.admissionYear),
      programme_start_date: form.programmeStartDate,
      academic_status: form.academicStatus,
      graduation_date: form.academicStatus === "In Progress" ? null : form.graduationDate ? `${form.graduationDate}-01` : null,
    }).eq("student_id", userId);
    if (academicResult.error) {
      console.error("Student academic details update failed:", academicResult.error);
      setError("Personal details were saved, but academic details could not be saved.");
      setSaving(false);
      return;
    }

    const employmentResult = await supabase.from("employment_history").update({
      employment_status_id: form.employmentStatusId,
      employer_name: form.employer.trim() || null,
      job_title: form.jobTitle.trim() || "Student",
      country: "Nigeria",
      state: form.workState,
      city: form.workCity,
    }).eq("id", String(record.employment.id)).eq("student_id", userId);
    if (employmentResult.error) {
      console.error("Student employment details update failed:", employmentResult.error);
      setError("Personal and academic details were saved, but employment details could not be saved.");
      setSaving(false);
      return;
    }

    setRecord((current) => current && ({
      ...current,
      profile: { ...(current.profile ?? {}), first_name: form.firstName, middle_name: form.middleName, last_name: form.lastName, phone: form.phone, country: form.country, state: form.state, city: form.city },
      academic: { ...(current.academic ?? {}), programme_id: programme.id, degree_type: programme.degree_type, admission_year: Number(form.admissionYear), programme_start_date: form.programmeStartDate, academic_status: form.academicStatus, graduation_date: form.graduationDate },
      employment: { ...(current.employment ?? {}), employment_status_id: form.employmentStatusId, employer_name: form.employer, job_title: form.jobTitle, state: form.workState, city: form.workCity },
    }));
    setNotice("Your profile has been updated.");
    setSaving(false);
  }

  async function submitDeletionRequest() {
    if (deletionConfirmation !== "DELETE") return;
    setSaving(true);
    setError("");
    setNotice("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user?.email) {
      setError("Your session could not be verified. Please sign in again.");
      setSaving(false);
      return;
    }
    const { error: requestError } = await supabase.from("student_profile_deletion_requests").insert({ student_id: auth.user.id, email: auth.user.email });
    if (requestError) {
      console.error("Student profile deletion request failed:", requestError);
      setError(requestError.code === "23505" ? "A full profile deletion request is already pending review." : "Your request could not be submitted. Please try again later.");
      setSaving(false);
      return;
    }
    setDeletionPending(true);
    setDeletionDialogOpen(false);
    setDeletionConfirmation("");
    setNotice("Your full profile deletion request was submitted for review. Your account and records have not been deleted.");
    setSaving(false);
  }

  return <div className="page-wrap-narrow space-y-6 py-8">
    <header>
      <p className="section-kicker">Account settings</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#122b55]">Update your profile</h1>
      <p className="mt-2 text-sm text-slate-600">Review and update your personal, academic, and employment details.</p>
    </header>
    {notice && <p role="status" className="status-panel" data-tone="success">{notice}</p>}
    {error && <p role="alert" className="status-panel" data-tone="error">{error}</p>}
    {busy ? <p role="status" className="surface-card rounded-2xl p-5">Loading your profile...</p> : <form onSubmit={(event) => void save(event)} className="space-y-6">
      <fieldset disabled={saving} className="surface-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:p-7 disabled:opacity-70">
        <legend className="px-2 text-lg font-semibold text-[#122b55]">Personal information</legend>
        <label className={fieldLabel}>First name<input required value={form.firstName} onChange={(event) => update("firstName", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Middle name<input value={form.middleName} onChange={(event) => update("middleName", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Last name<input required value={form.lastName} onChange={(event) => update("lastName", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Email<input type="email" readOnly value={read(record?.profile ?? null, "email")} className={fieldClass} /></label>
        <label className={fieldLabel}>Phone<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Country<input readOnly value={form.country} className={fieldClass} /></label>
        <label className={fieldLabel}>State<input required value={form.state} onChange={(event) => update("state", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>City<input required value={form.city} onChange={(event) => update("city", event.target.value)} className={fieldClass} /></label>
      </fieldset>
      <fieldset disabled={saving} className="surface-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:p-7 disabled:opacity-70">
        <legend className="px-2 text-lg font-semibold text-[#122b55]">Academic information</legend>
        <label className={fieldLabel}>Faculty<select required value={form.facultyId} onChange={(event) => { setDepartments([]); setProgrammes([]); setForm((current) => ({ ...current, facultyId: event.target.value, departmentId: "", programmeId: "" })); }} className={fieldClass}><option value="">Select faculty</option>{faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className={fieldLabel}>Department<select required value={form.departmentId} disabled={!form.facultyId} onChange={(event) => { setProgrammes([]); setForm((current) => ({ ...current, departmentId: event.target.value, programmeId: "" })); }} className={fieldClass}><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className={fieldLabel}>Programme<select required value={form.programmeId} disabled={!form.departmentId} onChange={(event) => update("programmeId", event.target.value)} className={fieldClass}><option value="">Select programme</option>{programmes.map((item) => <option key={item.id} value={item.id}>{item.degree_type}</option>)}</select></label>
        <label className={fieldLabel}>Admission year<input type="number" min="1950" max="2100" required value={form.admissionYear} onChange={(event) => update("admissionYear", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Programme start date<input type="date" required value={form.programmeStartDate} onChange={(event) => update("programmeStartDate", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Academic status<select required value={form.academicStatus} onChange={(event) => update("academicStatus", event.target.value)} className={fieldClass}><option value="">Select status</option>{["In Progress", "Completed", "Graduated"].map((item) => <option key={item}>{item}</option>)}</select></label>
        {form.academicStatus !== "In Progress" && <label className={fieldLabel}>Graduation date<input type="month" value={form.graduationDate} onChange={(event) => update("graduationDate", event.target.value)} className={fieldClass} /></label>}
      </fieldset>
      <fieldset disabled={saving} className="surface-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:p-7 disabled:opacity-70">
        <legend className="px-2 text-lg font-semibold text-[#122b55]">Employment information</legend>
        <label className={fieldLabel}>Employment status<select required value={form.employmentStatusId} onChange={(event) => update("employmentStatusId", event.target.value)} className={fieldClass}><option value="">Select status</option>{employmentStatuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className={fieldLabel}>Current employer<input value={form.employer} onChange={(event) => update("employer", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Job title<input required value={form.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} className={fieldClass} /></label>
        <label className={fieldLabel}>Work state<select required value={form.workState} onChange={(event) => { setCities([]); setForm((current) => ({ ...current, workState: event.target.value, workCity: "" })); }} className={fieldClass}><option value="">Select state</option>{states.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
        <label className={fieldLabel}>Work city<select required value={form.workCity} disabled={!workState} onChange={(event) => update("workCity", event.target.value)} className={fieldClass}><option value="">Select city</option>{cities.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
      </fieldset>
      <div className="flex justify-end"><button type="submit" disabled={saving} className="button-primary disabled:opacity-60">{saving ? "Saving..." : "Save profile"}</button></div>
    </form>}
    <section className="rounded-2xl border border-red-200 bg-card p-5 sm:p-7" aria-labelledby="profile-deletion-heading">
      <h2 id="profile-deletion-heading" className="text-lg font-semibold text-red-900">Full profile deletion</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Deleting a full profile may affect university records. Submit a separate request for review; your profile and account will not be deleted automatically.</p>
      {deletionPending ? <p role="status" className="mt-4 text-sm font-semibold text-amber-800">A deletion request is pending review.</p> : <button type="button" onClick={() => setDeletionDialogOpen(true)} className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50">Request full profile deletion</button>}
    </section>
    {deletionDialogOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-profile-deletion" className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <h2 id="confirm-profile-deletion" className="text-xl font-semibold text-red-900">Confirm deletion request</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">This sends a request for College review. It does not immediately delete your account or records. Type DELETE to confirm.</p>
        <label className="mt-4 block text-sm font-medium text-slate-700">Confirmation<input value={deletionConfirmation} onChange={(event) => setDeletionConfirmation(event.target.value)} className="mt-2 w-full" autoComplete="off" /></label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => { setDeletionDialogOpen(false); setDeletionConfirmation(""); }} className="button-secondary">Cancel</button>
          <button type="button" disabled={deletionConfirmation !== "DELETE" || saving} onClick={() => void submitDeletionRequest()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting..." : "Submit request"}</button>
        </div>
      </section>
    </div>}
  </div>;
}
