import { notFound } from "next/navigation";
import ProjectForm from "@/app/admin/_components/ProjectForm";
import { getProjectById, listServices } from "@/lib/db";
import AdminTabs from "@/app/admin/_components/AdminTabs";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, services] = await Promise.all([
    getProjectById(params.id),
    listServices()
  ]);

  if (!project) return notFound();

  // Temporary debug logging for project photo display issues.
  console.info("[admin/edit] project photo query", {
    projectId: params.id,
    returnedPhotoCount: project.photos?.length ?? 0,
    firstPhotoUrl: project.photos?.[0]?.public_url ?? null
  });

  return (
    <section className="section">
      <h1 className="hero-title">Edit project</h1>
      <AdminTabs currentPath="/admin" />
      <ProjectForm mode="edit" services={services} project={project} />
    </section>
  );
}
