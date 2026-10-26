import { supabase } from "@/lib/supabase";

export type StudentRegistration = {
  profile: Record<string, unknown> | null;
  academic: Record<string, unknown> | null;
  skills: { skill_id: string }[];
  preference: { no_side_skills: boolean } | null;
  employment: Record<string, unknown> | null;
};

// Queries only columns already used by registration writes, plus explicit known lookup IDs.
export async function getStudentRegistration(studentId: string): Promise<StudentRegistration> {
  const [profileResult, academicResult, skillsResult, preferenceResult, employmentResult] = await Promise.all([
    supabase.from("student_profiles").select("student_id,first_name,middle_name,last_name,email,phone,country,state,city").eq("student_id", studentId).maybeSingle(),
    supabase.from("student_academic_records").select("id,student_id,programme_id,degree_type,admission_year,programme_start_date,academic_status,graduation_date").eq("student_id", studentId).limit(1).maybeSingle(),
    supabase.from("student_skills").select("skill_id").eq("student_id", studentId),
    supabase.from("student_skill_preferences").select("no_side_skills").eq("student_id", studentId).maybeSingle(),
    supabase.from("employment_history").select("id,student_id,employment_status_id,job_title,employer_name,country,state,city,is_current").eq("student_id", studentId).eq("is_current", true).limit(1).maybeSingle(),
  ]);
  const failed = [profileResult, academicResult, skillsResult, preferenceResult, employmentResult].find((result) => result.error);
  if (failed?.error) throw failed.error;
  return {
    profile: profileResult.data,
    academic: academicResult.data,
    skills: skillsResult.data ?? [],
    preference: preferenceResult.data,
    employment: employmentResult.data,
  };
}

export function registrationResumeStep(record: StudentRegistration): number {
  if (!record.profile || !record.academic) return 2;
  // Before the explicit preference existed, a completed registration could have no skill rows.
  if (record.employment) return 0;
  if (record.skills.length || record.preference) return 4;
  if (!record.skills.length && !record.preference) return 3;
  return 3;
}
