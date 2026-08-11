import {NextRequest,NextResponse} from "next/server";
import {getMaterialCatalog,saveMaterialCatalog} from "@/lib/mega-estimator/repository";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json(await getMaterialCatalog())}
export async function PUT(request:NextRequest){try{return NextResponse.json(await saveMaterialCatalog(await request.json(),"admin-token-user"))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Material catalogue could not be saved."},{status:503})}}
