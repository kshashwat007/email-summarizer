import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";


export async function PATCH(request: NextRequest) {
  try {
    await connectMongo();
    const url = new URL(request.url)

    const id = url.searchParams.get("id")
    const deletedSummary = await Summary.deleteOne({ _id: id });
    return Response.json({success:"Summary Deleted"})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
