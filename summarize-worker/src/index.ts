/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { Receiver } from "@upstash/qstash";
import { OpenAI } from 'openai'

export interface Env {
  QSTASH_CURRENT_SIGNING_KEY: string;
  QSTASH_NEXT_SIGNING_KEY: string;
  QSTASH_TOKEN: string;
}

const summarize_worker =  {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const c = new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    });

    let body = await request.text();
    
    const isValid = await c.verify({
      signature: request.headers.get("Upstash-Signature")!,
      body,
    }).catch((err) => {
      console.error(err);
      return false;
    });
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }
    body = JSON.parse(body)
    console.log("The signature was valid",body);

    // const { hello } = body
    // console.log(hello)
    // do work here
    const { userId, openaiKey, emailContent, sender, subject, date, summaryLength } = body

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
        { role: 'user', content: `This is the email body. ${emailContent}` }
      ],
      model: 'gpt-3.5-turbo-1106',
      response_format: { type: 'json_object' }
    })
    console.log('AI Summary', completion.choices[0].message)

    let summary = completion.choices[0].message.content

    let summaryObj = JSON.parse(summary)
    summaryObj['sender'] = sender
    summaryObj['subject'] = subject
    summaryObj['date'] = date
    summaryObj['userID'] = userId

    fetch('/api/saveSummary', {
      method: 'POST',
      body: summaryObj,
      headers: {
        'Content-type': 'application/json; charset=UTF-8', 'Authorization': `Bearer ${env.QSTASH_TOKEN}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log("Summary Added")
    })
    .then(data => {
      console.log("Summary Added")
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
    return new Response("Hello World!");
  },
};

export default summarize_worker