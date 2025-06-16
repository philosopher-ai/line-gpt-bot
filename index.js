const express = require('express');
const line = require('@line/bot-sdk');
const { OpenAI } = require('openai');

const config = {
    channelAccessToken: 'あなたのLINEチャネルアクセストークン',
    channelSecret: 'bdb659b3c4e0c0cde575fbe0e40398955'
};

const openai = new OpenAI({
    apiKey: 'あなたのOpenAIのAPIキー'
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

            const client = new line.Client(config);
            await client.replyMessage(event.replyToken, { type: 'text', text: replyText });
        }
    }
    res.status(200).send('OK');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
