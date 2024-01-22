import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";


export async function PATCH(request: NextRequest) {
  try {
    await connectMongo();
    const url = new URL(request.url)

    const id = url.searchParams.get("id")
    let data = await request.json()
    console.log("ID",id)
    const user = await User.findByIdAndUpdate(id,data)
    await user.save()
    if (!user) {
      return Response.json({error:"Update Error"})
    }
    return Response.json({success:"User Updated"})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
