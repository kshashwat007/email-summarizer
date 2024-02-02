import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";


export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    let data = await request.json()
    await Summary.create(data)
    return Response.json({success:"Summary Saved"})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
