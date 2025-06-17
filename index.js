const express = require('express');
const line = require('@line/bot-sdk');
const { OpenAI } = require('openai');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(express.json());

app.post('/callback', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      const gptResponse = await openai.chat.completions.create({
        messages: [{ role: 'user', content: userMessage }],
        model: 'gpt-3.5-turbo'
      });

      const replyText = gptResponse.choices[0].message.content.trim();

      await client.replyMessage(event.replyToken, { type: 'text', text: replyText });
    }
  }

  res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
