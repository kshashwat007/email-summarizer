// @ts-ignore
const { Queue, Worker, Job } = require('bullmq')
const { OpenAI } = require('openai')
import connectMongo from './libs/mongoose'
import User from './models/User'
import Summary from './models/Summary'
import { Redis } from '@upstash/redis'

const redisConnection = new Redis({
  url: 'https://eu2-related-treefrog-30277.upstash.io',
  token:
    'AXZFASQgMDc2ZDk0ODAtYzU5Ni00MDY4LTkxMzYtOWI1ODlmYzZkNmJlMjEzZTlmYzlhZTU0NGE1NWIxMTJkYTI5ZGRiZmMwM2E='
})

const emailSummarizationQueue = new Worker(
  'emailSummarizer',
  async (job) => {
    console.log('Data')
    await connectMongo()

    console.log('DB Connected')
    const { userId, emailContent, sender, subject, date, summaryLength } =
      job.data
    console.log('ID', userId)

    const userOpenAIToken = await User.findOne({ _id: userId })
      .select('openaiKey')
      .exec()
    // console.log('User', user)
    let summary = await summarizeEmail(
      emailContent,
      userOpenAIToken.openaiKey,
      summaryLength
    )
    console.log('Summarizing')
    let summaryObj = JSON.parse(summary)
    summaryObj['sender'] = sender
    summaryObj['subject'] = subject
    summaryObj['date'] = date
    summaryObj['userID'] = userId
    console.log('SummaryData')
    await Summary.create(summaryObj)
    console.log('Data save')
  },
  {
    connection: redisConnection
  }
)

emailSummarizationQueue.on('failed', (job, failedReason) => {
  console.error(`Job #${job.id} failed with reason: ${failedReason}`)
})

// console.log('queue', emailSummarizationQueue)

async function summarizeEmail(emailBody, openaiKey, summaryLength) {
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
