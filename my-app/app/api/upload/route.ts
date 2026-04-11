
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import 'dotenv/config'


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);








export async function POST(req:Request){

    try{
        const formData = await req.formData();
        const file = await formData.get("adImage") as File

        if(!file){
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }


        const buffer = Buffer.from(await file.arrayBuffer());
        const fileKey = `${Date.now()}-${file.name}`;

        const {error} = await supabase.storage.from("adImage").upload(fileKey,buffer,{
            contentType:"application/adImage"
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ status: "queued", fileKey });

    }catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
    }



}
