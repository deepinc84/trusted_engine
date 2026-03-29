import { NextResponse } from "next/server";
import { updateProject } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const form = await request.formData();
  const toNumber = (v: FormDataEntryValue | null) => {
    if (typeof v !== "string" || !v.trim()) return null;
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : null;
  };

  try {
    await updateProject(params.id, {
      actual_sale_price: toNumber(form.get("actual_sale_price")),
      actual_material_cost: toNumber(form.get("actual_material_cost")),
      actual_labor_cost: toNumber(form.get("actual_labor_cost"))
    });
    return NextResponse.redirect(new URL("/admin/actuals", request.url), { status: 303 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update actuals" }, { status: 400 });
  }
}
