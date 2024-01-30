import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const url = new URL(request.url)

    const id = url.searchParams.get("id")
    const fetchedSummary = await Summary.findOne({ _id: id });
    return Response.json(fetchedSummary)
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
