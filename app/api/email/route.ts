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
      let emailData = {  
        "sender":{  
           "name":"Summailize",
           "email":"mail@summailize.com"
        },
        "to":[  
           {  
              "email": user.email,
           }
        ],
        "subject":"Your Summailize Email Summaries",
        "htmlContent":`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Summailize Email Summaries</title><style type="text/css" emogrify="no">#outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } table td { border-collapse: collapse; mso-line-height-rule: exactly; } .editable.image { font-size: 0 !important; line-height: 0 !important; } .nl2go_preheader { display: none !important; mso-hide:all !important; mso-line-height-rule: exactly; visibility: hidden !important; line-height: 0px !important; font-size: 0px !important; } body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; } img { outline:none; text-decoration:none; -ms-interpolation-mode: bicubic; } a img { border:none; } table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; } th { font-weight: normal; text-align: left; } *[class="gmail-fix"] { display: none !important; } </style><style type="text/css" emogrify="no"> @media (max-width: 600px) { .gmx-killpill { content: ' D1';} } </style><style type="text/css" emogrify="no">@media (max-width: 600px) { .gmx-killpill { content: ' D1';} .r0-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 320px !important } .r1-i { background-color: #ffffff !important } .r2-c { box-sizing: border-box !important; text-align: center !important; valign: top !important; width: 100% !important } .r3-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 100% !important } .r4-i { background-color: #ffffff !important; padding-bottom: 20px !important; padding-left: 15px !important; padding-right: 15px !important; padding-top: 20px !important } .r5-c { box-sizing: border-box !important; display: block !important; valign: top !important; width: 100% !important } .r6-o { border-style: solid !important; width: 100% !important } .r7-i { padding-left: 0px !important; padding-right: 0px !important } .r8-i { padding-bottom: 20px !important; padding-left: 15px !important; padding-right: 15px !important; padding-top: 20px !important } .r9-c { box-sizing: border-box !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r10-c { box-sizing: border-box !important; padding-bottom: 15px !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r11-i { padding-bottom: 20px !important; padding-left: 0px !important; padding-right: 0px !important; padding-top: 20px !important } .r12-c { box-sizing: border-box !important; padding: 0 !important; text-align: center !important; valign: top !important; width: 100% !important } .r13-o { border-style: solid !important; margin: 0 auto 0 auto !important; margin-bottom: 15px !important; margin-top: 15px !important; width: 100% !important } .r14-i { padding: 0 !important; text-align: center !important } .r15-r { background-color: #ee7fbb !important; border-color: #ee7fbb !important; border-radius: 4px !important; border-width: 0px !important; box-sizing: border-box; height: initial !important; padding: 0 !important; padding-bottom: 12px !important; padding-left: 5px !important; padding-right: 5px !important; padding-top: 12px !important; text-align: center !important; width: 100% !important } .r16-i { background-color: #eff2f7 !important; padding-bottom: 20px !important; padding-left: 15px !important; padding-right: 15px !important; padding-top: 20px !important } .r17-c { box-sizing: border-box !important; text-align: left !important; valign: top !important; width: 100% !important } .r18-o { border-style: solid !important; margin: 0 auto 0 0 !important; width: 100% !important } .r19-i { padding-bottom: 0px !important; padding-top: 15px !important; text-align: center !important } .r20-i { padding-bottom: 0px !important; padding-top: 0px !important; text-align: center !important } .r21-i { padding-bottom: 15px !important; padding-top: 15px !important; text-align: center !important } .r22-c { box-sizing: border-box !important; text-align: center !important; width: 100% !important } .r23-i { padding-bottom: 15px !important; padding-left: 0px !important; padding-right: 0px !important; padding-top: 0px !important } .r24-c { box-sizing: border-box !important; text-align: center !important; valign: top !important; width: 129px !important } .r25-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 129px !important } body { -webkit-text-size-adjust: none } .nl2go-responsive-hide { display: none } .nl2go-body-table { min-width: unset !important } .mobshow { height: auto !important; overflow: visible !important; max-height: unset !important; visibility: visible !important; border: none !important } .resp-table { display: inline-table !important } .magic-resp { display: table-cell !important } } </style><style type="text/css">p, h1, h2, h3, h4, ol, ul, li { margin: 0; } a, a:link { color: #ee7fbb; text-decoration: underline } .nl2go-default-textstyle { color: #3b3f44; font-family: Bricolage Grotesque, arial; font-size: 16px; line-height: 1.5; word-break: break-word } .default-button { color: #000000; font-family: Bricolage Grotesque, arial; font-size: 16px; font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word } .default-heading1 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 36px; word-break: break-word } .default-heading2 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 32px; word-break: break-word } .default-heading3 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 24px; word-break: break-word } .default-heading4 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 18px; word-break: break-word } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .no-show-for-you { border: none; display: none; float: none; font-size: 0; height: 0; line-height: 0; max-height: 0; mso-hide: all; overflow: hidden; table-layout: fixed; visibility: hidden; width: 0; } </style><!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--><style type="text/css">a:link{color: #ee7fbb; text-decoration: underline;}</style></head><body bgcolor="#ffffff" text="#3b3f44" link="#ee7fbb" yahoo="fix" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" class="nl2go-body-table" width="100%" style="background-color: #ffffff; width: 100%;"><tr><td> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="600" align="center" class="r0-o" style="table-layout: fixed; width: 600px;"><tr><td valign="top" class="r1-i" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td class="r4-i" style="background-color: #ffffff; padding-bottom: 20px; padding-top: 20px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r6-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r7-i" style="padding-left: 15px; padding-right: 15px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r2-c" align="center"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="200" class="r3-o" style="table-layout: fixed; width: 200px;"><tr><td style="font-size: 0px; line-height: 0px;"> <img src="https://img.mailinblue.com/7103317/images/content_library/original/65c60d510c4200dde5125601.png" width="200" border="0" style="display: block; width: 100%;"></td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table><table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td class="r8-i" style="padding-bottom: 20px; padding-top: 20px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r6-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r7-i" style="padding-left: 15px; padding-right: 15px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r9-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: Bricolage Grotesque,arial; font-size: 16px; line-height: 1.5; word-break: break-word; padding-top: 15px; text-align: left; valign: top;"> <div><h2 class="default-heading2" style="margin: 0; color: #1f2d3d; font-family: arial,helvetica,sans-serif; font-size: 32px; word-break: break-word;">Your Summaries will be done soon.</h2></div> </td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table><table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td class="r8-i" style="padding-bottom: 20px; padding-top: 20px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r6-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r7-i" style="padding-left: 15px; padding-right: 15px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r10-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: Bricolage Grotesque,arial; font-size: 16px; line-height: 1.5; word-break: break-word; padding-bottom: 15px; padding-top: 15px; text-align: left; valign: top;"> <div><p style="margin: 0;">Be sure to check up on your summaries soon. They should be done anytime now.</p></div> </td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table><table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td class="r11-i" style="padding-bottom: 20px; padding-top: 20px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r6-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r7-i" style="padding-left: 10px; padding-right: 10px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r12-c" align="center" style="align: center; padding-bottom: 15px; padding-top: 15px; valign: top;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="290" class="r13-o" style="background-color: #ee7fbb; border-collapse: separate; border-color: #ee7fbb; border-radius: 4px; border-style: solid; border-width: 0px; table-layout: fixed; width: 290px;"><tr><td height="18" align="center" valign="top" class="r14-i nl2go-default-textstyle" style="word-break: break-word; background-color: #ee7fbb; border-radius: 4px; color: #000000; font-family: Bricolage Grotesque, arial; font-size: 16px; font-style: normal; line-height: 1.15; padding-bottom: 12px; padding-left: 5px; padding-right: 5px; padding-top: 12px; text-align: center;"> <a href="https://app.summailize.com/dashboard" class="r15-r default-button" target="_blank" data-btn="1" style="font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word; word-wrap: break-word; display: block; -webkit-text-size-adjust: none; color: #000000; font-family: Bricolage Grotesque, arial; font-size: 16px;"> <span>Read Summaries</span></a> </td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table><table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td class="r16-i" style="background-color: #eff2f7; padding-bottom: 20px; padding-top: 20px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r6-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r7-i" style="padding-left: 15px; padding-right: 15px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r17-c" align="left"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r18-o" style="table-layout: fixed; width: 100%;"><tr><td align="center" valign="top" class="r19-i nl2go-default-textstyle" style="color: #3b3f44; font-family: Bricolage Grotesque,arial; word-break: break-word; font-size: 18px; line-height: 1.5; padding-top: 15px; text-align: center;"> <div><p style="margin: 0;">Summailize</p></div> </td> </tr></table></td> </tr><tr><td class="r17-c" align="left"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r18-o" style="table-layout: fixed; width: 100%;"><tr><td align="center" valign="top" class="r20-i nl2go-default-textstyle" style="color: #3b3f44; font-family: Bricolage Grotesque,arial; word-break: break-word; font-size: 18px; line-height: 1.5; text-align: center;"> <div><p style="margin: 0; font-size: 14px;">You've received this email because you've subscribed to our newsletter.</p></div> </td> </tr></table></td> </tr><tr><td class="r17-c" align="left"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r18-o" style="table-layout: fixed; width: 100%;"><tr><td align="center" valign="top" class="r21-i nl2go-default-textstyle" style="color: #3b3f44; font-family: Bricolage Grotesque,arial; word-break: break-word; font-size: 18px; line-height: 1.5; padding-bottom: 15px; padding-top: 15px; text-align: center;"> <div><p style="margin: 0; font-size: 14px;"> <a href="{{ unsubscribe }}" style="color: #ee7fbb; text-decoration: underline;">Unsubscribe</a></p></div> </td> </tr></table></td> </tr><tr><td class="r22-c" align="center"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r23-i" style="padding-bottom: 15px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r24-c" align="center"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="129" class="r25-o" style="table-layout: fixed;"><tr><td height="48" style="font-size: 0px; line-height: 0px;"> <a href="https://www.brevo.com?utm_source=logo_client&utm_medium=email"><img src="https://creative-assets.mailinblue.com/rnb-assets/en.png" width="129" height="48" border="0" style="display: block; width: 100%;"></a></td> </tr></table></td> </tr></table></td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table></td> </tr></table></td> </tr></table></body></html>
        `
     }
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'accept': 'application/json', 'api-key': process.env.BREVO_KEY },
        body: JSON.stringify(emailData)
      })
      await Promise.all(enqueuedJobs);
      // Send Mail to user that that his mails will be summarized soon
    });
    const counts = await emailSummarizationQueue.getJobCounts('wait', 'completed', 'failed');
    console.log("Done", counts)
    return Response.json({ message: 'Email summarization tasks enqueued.' });
} catch (error) {
    // console.error(error);
    return Response.json({error: error})
}
}