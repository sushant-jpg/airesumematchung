import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminDashboard, ApplicantView, CandidateApplications, CandidateDashboard, CreateJobView, GenericView, RecruiterDashboard, ResumeView } from "@/components/portal-views";

export default async function PortalPage({ params }: { params: Promise<{ role: string; section?: string[] }> }) {
  const { role, section: segments } = await params; if (!segments?.length) redirect(`/${role}/dashboard`);
  if (!(["candidate","recruiter","admin"] as const).includes(role as "candidate" | "recruiter" | "admin")) notFound();
  const section = segments[0] ?? "dashboard"; let view: React.ReactNode;
  if (role === "candidate" && section === "dashboard") view = <CandidateDashboard/>;
  else if (role === "candidate" && section === "applications") view = <CandidateApplications/>;
  else if (role === "candidate" && section === "resume") view = <ResumeView/>;
  else if (role === "candidate" && section === "recommended") view = <><GenericView role={role} section={section}/></>;
  else if (role === "recruiter" && section === "dashboard") view = <RecruiterDashboard/>;
  else if (role === "recruiter" && section === "applicants") view = <ApplicantView/>;
  else if (role === "recruiter" && section === "create-job") view = <CreateJobView/>;
  else if (role === "admin" && section === "dashboard") view = <AdminDashboard/>;
  else view = <GenericView role={role} section={section}/>;
  return <DashboardShell role={role as "candidate" | "recruiter" | "admin"} current={section}>{view}</DashboardShell>;
}
