import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import Bee from 'bee-queue';
const { Queue, Worker } = require('bullmq')
import { createClient } from 'redis';
// import { Redis } from '@upstash/redis'
import {Redis} from "ioredis"
export const dynamic = 'force-dynamic'
import { Client } from "@upstash/qstash";

const client = new Client({ token: "eyJVc2VySUQiOiIyNDQwZDBkNC0zMTczLTQ1ZmMtYThhMy0wMmE1ZGIxOWEzODQiLCJQYXNzd29yZCI6ImRhNzA4NTYxN2VhMjQ4ZmNiYTlkNTUzY2NkOWY2OGI5In0=" });

const redisConnection = new Redis("rediss://default:213e9fc9ae544a55b112da29ddbfc03a@eu2-related-treefrog-30277.upstash.io:30277",{maxRetriesPerRequest: null});

// const redisConnection = new Redis({
//   url: 'https://eu2-related-treefrog-30277.upstash.io',
//   token:
//     'AXZFASQgMDc2ZDk0ODAtYzU5Ni00MDY4LTkxMzYtOWI1ODlmYzZkNmJlMjEzZTlmYzlhZTU0NGE1NWIxMTJkYTI5ZGRiZmMwM2E='
// })


const emailSummarizationQueue = new Queue('emailSummarizerProd', {
  connection: redisConnection,
  limiter: {
    max: 20,
    duration: 60000,
  }
});

async function authenticate(refreshToken: String) {
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET
  );
  
  // console.log("Refresh token", refreshToken)
  oAuth2Client.setCredentials({
      refresh_token: refreshToken,
  });

  return oAuth2Client;
}

function getPlainTextBody(message: { payload: {
  headers: any; parts: any[]; body: { data: string; }; 
}; }) {
  // Emails may be multipart, check the payload parts
  const parts = message.payload.parts || [];
  let plainTextBody = "";
  const sender = message.payload.headers.find((obj: { name: string; }) => obj.name == "From").value
  const subject = message.payload.headers.find((obj: { name: string; }) => obj.name == "Subject").value
  const date = message.payload.headers.find((obj: { name: string; }) => obj.name == "Date").value
  for (const part of parts) {
      if (part.mimeType === 'text/plain') {
          plainTextBody = part.body.data;
          break;
      }
  }

  // If the email is not multipart, the body might be directly in the payload
  if (!plainTextBody && message.payload.body.data) {
      plainTextBody = message.payload.body.data;
  }

  const data = {
    plainTextBody,
    sender,
    subject,
    date
  }
  return data;
}

function decodeBase64Url(encodedStr: string) {
  // Replace URL-safe characters
  const base64String = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
  // Base64 decode
  const decodedBytes = Buffer.from(base64String, 'base64').toString('utf-8');
  return decodedBytes;
}

async function fetchUnreadEmails(auth: any) {
  const gmail = google.gmail({ version: 'v1', auth });
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const response = await gmail.users.messages.list({
      userId: 'me',
      q: `is:unread after:${oneWeekAgo.toISOString().split('T')[0]}`,
      maxResults: 5
  });
  // console.log("RES", response)
  const fullEmails = await Promise.all(response.data.messages.map((msg: { id: any; }) => getEmailContent(msg.id, auth)));
  // console.log("Email list", fullEmails)
  
  const emailBodies = fullEmails.map(email => {
    const encodedBodyData = getPlainTextBody(email);
    const encodedBody = encodedBodyData.plainTextBody

    const decodedBody = decodeBase64Url(encodedBody);
    const sender = encodedBodyData.sender
    const subject = encodedBodyData.subject
    const date = encodedBodyData.date
    const resData = {
      decodedBody,
      sender,
      subject,
      date
    }
    return resData
  });

  // console.log("Email", fullEmails)
  return emailBodies || [];
}

async function getEmailContent(messageId: any, auth: any) {
  const gmail = google.gmail({ version: 'v1', auth });
  const emailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
  });

  
  return emailResponse.data;
}


export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const user = await User.findById(id);
    // Access user properties and perform actions
    const auth = await authenticate(user.refreshToken);
    const emails = await fetchUnreadEmails(auth);
    let openaiKey = process.env.OPENAI_API_KEY
    console.log(openaiKey)
    let enqueuedJobs = emails.map(async (email) => {
      return await emailSummarizationQueue.add("emailJob",{
        "userId": user._id,
        "openaiKey": openaiKey,
        "emailContent": email.decodedBody,
        "sender": email.sender,
        "subject": email.subject,
        "date": email.date,
        "summaryLength": user.summaryLength
      });
    });
    await Promise.all(enqueuedJobs);
      // Send Mail to user that that his mails will be summarized soon
    const counts = await emailSummarizationQueue.getJobCounts('wait', 'completed', 'failed');
    console.log("Done", counts)
    return Response.json({ message: 'Email summarization tasks enqueued.' });
} catch (error) {
    // console.error(error);
    return Response.json({error: error})
}
}