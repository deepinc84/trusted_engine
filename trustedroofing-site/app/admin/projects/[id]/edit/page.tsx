import { notFound } from "next/navigation";
import ProjectForm from "@/app/admin/_components/ProjectForm";
import { getProjectById, listServices } from "@/lib/db";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, services] = await Promise.all([
    getProjectById(params.id),
    listServices()
  ]);

  if (!project) return notFound();

  return (
    <section className="section">
      <h1 className="hero-title">Edit project</h1>
      <ProjectForm mode="edit" services={services} project={project} />
    </section>
  );
}
