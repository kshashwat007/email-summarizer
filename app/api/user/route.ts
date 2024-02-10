// @ts-nocheck
import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const session = await getServerSession(authOptions);
    const user = await User.findById(session.user.id);
    if (user) {
      user.accessToken = session.user.accessToken
      user.refreshToken = session.user.refreshToken
      user.save()
    }
    console.log("user",user)
    return Response.json({user: user})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
