import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";

const bucket = () => process.env.PROPOSAL_ASSETS_BUCKET || "proposal-assets";

/** Admin-only download for the accepted contract referenced by a production project. */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: "Signed-contract storage is not configured." }, { status: 503 });
  const { data: acceptance, error } = await db.from("proposal_acceptances")
    .select("signed_pdf_storage_path,proposals!inner(id,proposal_number)")
    .eq("proposal_id", params.id).order("accepted_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "Signed-contract lookup failed." }, { status: 503 });
  if (!acceptance?.signed_pdf_storage_path) return NextResponse.json({ error: "The signed contract is not available yet." }, { status: 404 });
  const { data: file, error: downloadError } = await db.storage.from(bucket()).download(acceptance.signed_pdf_storage_path);
  if (downloadError || !file) return NextResponse.json({ error: "The signed contract could not be downloaded. Retry from System Status." }, { status: 503 });
  return new NextResponse(await file.arrayBuffer(), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="signed-contract-${params.id}.pdf"`, "cache-control": "private, no-store" } });
}
