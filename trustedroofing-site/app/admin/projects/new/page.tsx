import ProjectForm from "@/app/admin/_components/ProjectForm";
import { listServices } from "@/lib/db";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function NewProjectPage() {
  const services = await listServices();

  return (
    <section className="section">
      <h1 className="hero-title">Create project</h1>
      <AdminTabs currentPath="/admin/projects/new" />
      <ProjectForm mode="create" services={services} />
    </section>
  );
}
