import { NextResponse, NextRequest } from "next/server";
const { google } = require('googleapis');
import OpenAI from "openai";
import Summary from "@/models/Summary";
import connectMongo from "@/libs/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import {Client} from '@upstash/qstash'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

const schedules = qstash.schedules
schedules.create({
  destination: "https://qstash.upstash.io/v2/publish/",
  cron: "*/5 * * * *",
});
schedules.create({
  destination: "https://my-api...",
  cron: "*/5 * * * *",
});
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const { userId, emailContent, sender, subject, date, summaryLength } = await request.json()
    console.log("ID", userId)
    console.log("date",date)
    console.log("length",summaryLength)
    const userOpenAIToken = await User.findOne({ _id: userId })
      .select('openaiKey')
      .exec()
    
    
    console.log('User api key', userOpenAIToken.openaiKey)
    let summary = await summarizeEmail(
      emailContent,
      userOpenAIToken.openaiKey,
      summaryLength
    )
    let summaryObj = JSON.parse(summary)
    summaryObj['sender'] = sender
    summaryObj['subject'] = subject
    summaryObj['date'] = date
    summaryObj['userID'] = userId
    await Summary.create(summaryObj)
    console.log('Data save')
    return Response.json({message: 'Email processed successfully'})
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}


async function summarizeEmail(emailBody: any, openaiKey: any, summaryLength: any) {
  // console.log('Body', emailBody)
  try {
    const openai = new OpenAI({
      apiKey: openaiKey
    })

    let prompt = `You will be provided with the body of an email. Your task is to analyze the content 
and produce a summary. Specifically, you need to:
1. **Summarize the Email:** Extract the main points and themes from the email content.
2. **Extract Links:** Identify any URLs or web links included in the email body.
3. **Identify Action Items:** Highlight any tasks, requests, or action items mentioned.
3. Summary Length: The Summary Length should be ${summaryLength}
The output should be formatted as a JSON object, with the following keys and corresponding information:
- \`summary\`: A concise overview of the email's content.
- \`links\`: A list of any URLs found in the email.
- \`action_items\`: A list of tasks or actions that the recipient is expected to undertake.
The JSON should be readable, without unnecessary escape characters or slashes, and should be structured for easy understanding.`

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: prompt
        },
        { role: 'user', content: `This is the email body. ${emailBody}` }
      ],
      model: 'gpt-3.5-turbo-1106',
      response_format: { type: 'json_object' }
    })
    console.log('AI Summary', completion.choices[0].message)
    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error in OpenAI summarization:', error)
    throw error
  }
}