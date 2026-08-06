import { NextRequest,NextResponse } from "next/server";
import { saveMegaEstimate } from "@/lib/mega-estimator/repository";
export async function PUT(request:NextRequest,{params}:{params:{id:string}}){try{return NextResponse.json(await saveMegaEstimate({...await request.json(),id:params.id}))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Estimate could not be saved."},{status:503})}}
