import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Quote API ready.",
    routes: ["/api/quotes/step1", "/api/quotes/step2"]
  });
}
