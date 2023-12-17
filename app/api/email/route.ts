import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function authenticate() {
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET
  );

  oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oAuth2Client;
}

function getPlainTextBody(message) {
  // Emails may be multipart, check the payload parts
  const parts = message.payload.parts || [];
  let plainTextBody = "";

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

  return plainTextBody;
}

function decodeBase64Url(encodedStr) {
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

  const fullEmails = await Promise.all(response.data.messages.map((msg: { id: any; }) => getEmailContent(msg.id, auth)));

  const emailBodies = fullEmails.map(email => {
    const encodedBody = getPlainTextBody(email);
    return decodeBase64Url(encodedBody);
  });

  // console.log("Email", fullEmails)
  return emailBodies || [];
}

async function getSummaries(fullEmails: any) {
  const emailSummaries = await Promise.all(
    fullEmails.map(async (email: any) => {
      
      const summary = await summarizeEmail(email)
      return summary
    })
  )

  // const emailSummaries = await summarizeEmail(fullEmails)

  return emailSummaries
}
async function getEmailContent(messageId, auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const emailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
  });

  return emailResponse.data;
}

async function summarizeEmail(emailBody: String) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{"role": "system", "content": "You are a helpful assistant which summarizes emails based on the email body provided. For each body, get the links in it, summarize the email, if any action items provide that. I should know what the email is all about. Output should be in json and it should be beautified with no slashes and proper readable format. The keys will be different sections such as summary, links, action items etc."},
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

export async function GET(request: NextRequest) {
  try {
    console.log("GET Emails route")
    const auth = await authenticate();
    const emails = await fetchUnreadEmails(auth);
    const summaries = await getSummaries(emails)
    let summaryList: any[] = []
    summaries.map((summary) => {
      summaryList.push(JSON.parse(summary))
    })
    // const summaryDetails: {}[] = []
    // summaries.map((summary: any) => {
    //   let parsedObject = JSON.parse(summary)
    //   let fullDetail = {}
    //   let seperateObject = Object.keys(parsedObject).map(key => {
    //     return {[key]: parsedObject[key]}
    //   })
    //   fullDetail["summary"] = summary["summary"]
    //   fullDetail["links"] = summary["links"]
    //   fullDetail["actionItems"] = summary["action_items"]
    //   summaryDetails.push(fullDetail)
    //   console.log(summaryDetails)
    // })
    // const summariesFormatted = JSON.stringify(summaries, null, 2)
    
    // console.log("Emails", emails)
    return Response.json({emails: emails, summaries: summaries, summaryDetails: summaryList})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
