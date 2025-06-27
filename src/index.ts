// src/index.ts
import 'dotenv/config';
import express from 'express';
import { Client, middleware, MiddlewareConfig } from '@line/bot-sdk';
import OpenAI from 'openai';

/* ---- LINE 設定 -------------------------------------------- */
const lineConfig: MiddlewareConfig & {
  channelAccessToken: string;
  channelSecret: string;
} = {
  channelAccessToken: process.env.LINE_TOKEN as string,
  channelSecret: process.env.LINE_SECRET as string,
};
const lineClient = new Client(lineConfig);

/* ---- OpenAI 設定 ------------------------------------------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

/* ---- Express サーバー -------------------------------------- */
const app = express();
app.use(express.json());
app.use(middleware(lineConfig));

/* LINE の［検証］用 GET に 200 を返す */
app.get('/webhook', (_req, res) => { res.status(200).send('OK'); });

/* 本番メッセージを受け取る POST */
app.post('/webhook', async (req, res) => {
  const results = await Promise.all(req.body.events.map(handleEvent));
  res.json(results);
});

async function handleEvent(evt: any) {
  // ［検証］リクエストは無視
  if (
    evt.replyToken === '00000000000000000000000000000000' ||
    evt.replyToken === 'ffffffffffffffffffffffffffffffff'
  ) {
    return;
  }

  // テキスト以外は無視
  if (evt.type !== 'message' || evt.message.type !== 'text') return;

  // ChatGPT へ問い合わせ
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'あなたは慈悲深き釈迦。如来の知恵「縁起・無我・空・諸行無常・輪廻」を 1〜2 行で分かりやすく説き、最後に短い行動指針を与える。',
      },
      { role: 'user', content: evt.message.text },
    ],
    temperature: 0.7,
    max_tokens: 120,
  });

  // LINE に返信
  return lineClient.replyMessage(evt.replyToken, {
    type: 'text',
    text: completion.choices[0]?.message.content?.trim() ?? '',
  });
}

/* ---- ポート設定 -------------------------------------------- */
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
