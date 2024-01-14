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

const Redis = require('ioredis');

const redisConfig = {
  port: 6379,
  host: '127.0.0.1',
};

const redisConnection = new Redis(redisConfig);
// const redis = new Redis({
//   host: "127.0.0.1",
//   port: 6379,
//   username: "krishusername",
//   password: 'krishpassword'
// });


const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const emailSummarizationQueue = new Queue('emailSummarizer', {
  connection: redisConnection
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
  const sender = message.payload.headers.find((obj) => obj.name == "From").value
  const subject = message.payload.headers.find((obj) => obj.name == "Subject").value
  const date = message.payload.headers.find((obj) => obj.name == "Date").value
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
  const base64String = encodedStr.replace(/\-/g, '+').replace(/_/g, '/');
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

async function getSummaries(fullEmails: any) {
  const emailSummaries = await Promise.all(
    fullEmails.map(async (email: any) => {
      
      const sender = email.sender
      const subject = email.subject
      const date = email.date

      const summary = await summarizeEmail(email.decodedBody)
      const resData = {
        summary,
        sender,
        subject,
        date
      }
      return resData
    })
  )

  // const emailSummaries = await summarizeEmail(fullEmails)
  
  return emailSummaries
}

async function getEmailContent(messageId: any, auth: any) {
  const gmail = google.gmail({ version: 'v1', auth });
  const emailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
  });

  
  return emailResponse.data;
}

export async function summarizeEmail(emailBody: String) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{"role": "system", "content": "You are a helpful assistant which summarizes emails based on the email body provided. For each body, get the links in it, summarize the email, if any action items provide that. I should know what the email is all about. Output should be in json and it should be beautified with no slashes and proper readable format. The keys will be different sections such as summary, links, action items etc. The keys name should be summary,links,action_items"},
          {"role": "user", "content": `This is the email body. ${emailBody}`}],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" }
    });

      return completion.choices[0].message.content;
  } catch (error) {
      console.error("Error in OpenAI summarization:", error);
      throw error;
  }
}

// const emailSummarizationQueue = new Bee('emailSummarizationQueue');



export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    // const session = await getServerSession(authOptions);
    // console.log("Session", session)
    // console.log("Connected", emailSummarizationQueue)
    const users = await User.find({});
    users.forEach(async (userObj) => {
      // Access user properties and perform actions
      const user = await User.findById(userObj._id);
      const auth = await authenticate(userObj.refreshToken);
      const emails = await fetchUnreadEmails(auth);
      // console.log("EMAILS", emails)
      let enqueuedJobs = emails.map(async (email) => {
        return await emailSummarizationQueue.add("emailSummarizer",{
          userId: user._id,
          emailContent: email.decodedBody,
          sender: email.sender,
          subject: email.subject,
          date: email.date,
        });
        // return await emailSummarizationQueue.add("emailSummarizationQueue", { foo: 'bar' })
      });
      await Promise.all(enqueuedJobs);
    });
    
    const counts = await emailSummarizationQueue.getJobCounts('wait', 'completed', 'failed');
    console.log("Done", counts)
    // emailSummarizationQueue.obliterate()
    return Response.json({ message: 'Email summarization tasks enqueued.' });
    // const summaries = await getSummaries(emails)
    
    // let summaryList: any[] = []
    // summaries.map(async (summary) => {
    //   let summaryObj = JSON.parse(summary.summary)
    //   summaryObj['sender'] = summary.sender
    //   summaryObj['subject'] = summary.subject
    //   summaryObj['date'] = summary.date
    //   summaryObj['userID'] = String(user._id)
    //   summaryList.push(summaryObj)
    //   await Summary.create(summaryObj)
    // })
    // return Response.json({emails: emails, summaries: summaries, summaryDetails: summaryList})
} catch (error) {
    // console.error(error);
    return Response.json({error: error})
}
}