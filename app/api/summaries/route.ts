import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const session = await getServerSession(authOptions);
    console.log("Session", session)
    const user = await User.findById(session.user.id);
    console.log("User", String(user._id))
    const fetchedSummaries = await Summary.find({userID: String(user._id)});
    return Response.json({summaries: fetchedSummaries})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
