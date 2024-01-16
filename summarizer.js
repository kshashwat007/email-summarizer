// @ts-ignore
const { Queue, Worker, Job } = require('bullmq')
const { OpenAI } = require('openai')
import connectMongo from './libs/mongoose'
import User from './models/User'
import Summary from './models/Summary'
const Redis = require('ioredis')

const redisConfig = {
  port: 6379,
  host: '127.0.0.1',
  maxRetriesPerRequest: null
}

const redisConnection = new Redis(redisConfig)

const emailSummarizationQueue = new Worker(
  'emailSummarizer',
  async (job) => {
    console.log('Data')
    await connectMongo()

    console.log('DB Connected')
    const { userId, emailContent, sender, subject, date } = job.data
    console.log('ID', userId)

    const userOpenAIToken = await User.findOne({ _id: userId })
      .select('openaiKey')
      .exec()
    // console.log('User', user)
    let summary = await summarizeEmail(emailContent, userOpenAIToken)
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

async function summarizeEmail(emailBody, openaiKey) {
  // console.log('Body', emailBody)
  try {
    const openai = new OpenAI({
      apiKey: openaiKey
    })
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant which summarizes emails based on the email body provided. For each body, get the links in it, summarize the email, if any action items provide that. I should know what the email is all about. Output should be in json and it should be beautified with no slashes and proper readable format. The keys will be different sections such as summary, links, action items etc. The keys name should be summary,links,action_items'
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
