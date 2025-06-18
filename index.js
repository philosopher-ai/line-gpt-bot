// index.js  ── 最小構成
import 'dotenv/config';
import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import OpenAI from 'openai';

const lineConfig = {
  channelAccessToken: process.env.LINE_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};
const client = new Client(lineConfig);
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const app = express();
app.use(middleware(lineConfig));

app.post('/webhook', async (req, res) => {
  const results = await Promise.all(req.body.events.map(handleEvent));
  res.json(results);
});

async function handleEvent(evt) {
  if (evt.type !== 'message' || evt.message.type !== 'text') return;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',          // 後で動的に切り替え
    messages: [
      {
        role: 'system',
        content:
          'あなたは慈悲深き釈迦。如来の知恵「縁起・無我・空・諸行無常・輪廻」を 1〜2 行で、分かりやすく説き、最後に短い行動指針を与える。',
      },
      { role: 'user', content: evt.message.text },
    ],
    temperature: 0.7,
    max_tokens: 120,
  });

  return client.replyMessage(evt.replyToken, {
    type: 'text',
    text: completion.choices[0].message.content.trim(),
  });
}

app.get('/', (_, res) => res.send('ok')); // Render のヘルスチェック用
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
