import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";


export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const fetchedSummaries = await Summary.find({});
    return Response.json({summaries: fetchedSummaries})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
