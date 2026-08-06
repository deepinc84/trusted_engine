import { NextRequest,NextResponse } from "next/server";
import { saveMegaEstimate } from "@/lib/mega-estimator/repository";
export async function POST(request:NextRequest){try{return NextResponse.json(await saveMegaEstimate(await request.json()),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Estimate could not be saved."},{status:503})}}
