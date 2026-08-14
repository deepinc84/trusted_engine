import {NextRequest,NextResponse} from "next/server";
import {saveCompanyDefaults} from "@/lib/mega-estimator/repository";
export async function PUT(request:NextRequest){try{return NextResponse.json(await saveCompanyDefaults(await request.json(),"admin-token-user"))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Defaults could not be saved."},{status:503})}}
