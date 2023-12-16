import { NextResponse, NextRequest } from "next/server";
const {google} = require('googleapis');

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

  console.log("Email", fullEmails)
  return emailBodies || [];
}

async function getEmailContent(messageId, auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const emailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
  });

  return emailResponse.data;
}

export async function GET(request: NextRequest) {
  try {
    console.log("GET Emails route")
    const auth = await authenticate();
    const emails = await fetchUnreadEmails(auth);
    // console.log("Emails", emails)
    return Response.json({success: emails})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
