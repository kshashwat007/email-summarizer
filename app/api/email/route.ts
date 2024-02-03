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



const emailSummarizationQueue = new Queue('emailSummarizer', {
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
      maxResults: 1
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

// async function getSummaries(fullEmails: any) {
//   const emailSummaries = await Promise.all(
//     fullEmails.map(async (email: any) => {
      
//       const sender = email.sender
//       const subject = email.subject
//       const date = email.date

//       const summary = await summarizeEmail(email.decodedBody)
//       const resData = {
//         summary,
//         sender,
//         subject,
//         date
//       }
//       return resData
//     })
//   )
  
//   return emailSummaries
// }

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
    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    const users = await User.find({});
    users.forEach(async (userObj) => {
      // Access user properties and perform actions
      const user = await User.findById(userObj._id);
      const auth = await authenticate(userObj.refreshToken);
      const emails = await fetchUnreadEmails(auth);
      
      let openaiKey = process.env.OPENAI_API_KEY
      let enqueuedJobs = emails.map(async (email) => {
        let summaryBody = {
          "userId": user._id,
          "openaiKey": openaiKey,
          "emailContent": email.decodedBody,
          "sender": email.sender,
          "subject": email.subject,
          "date": email.date,
          "summaryLength": user.summaryLength
        }
        // console.log("Body", summaryBody)
        // client.publishJSON({
        //   url: "https://summarize-worker.kshashwat007.workers.dev",
        //   body: summaryBody,
        //   headers: {
        //     'Content-type': 'application/json; charset=UTF-8', 'Authorization': `Bearer eyJVc2VySUQiOiIyNDQwZDBkNC0zMTczLTQ1ZmMtYThhMy0wMmE1ZGIxOWEzODQiLCJQYXNzd29yZCI6ImRhNzA4NTYxN2VhMjQ4ZmNiYTlkNTUzY2NkOWY2OGI5In0=`
        //   },
        //   delay: 10
        // })
        
        return await emailSummarizationQueue.add("emailSummarizerProd",summaryBody);
      });
      await Promise.all(enqueuedJobs);
    });
    
    return Response.json({ message: 'Email summarization tasks enqueued.' });
} catch (error) {
    // console.error(error);
    return Response.json({error: error})
}
}