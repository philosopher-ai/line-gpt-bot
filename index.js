const express = require('express');
const line = require('@line/bot-sdk');
const { OpenAI } = require('openai');

// LINE設定（環境変数から取得）
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// クライアント初期化
const client = new line.Client(config);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Express初期化
const app = express();
app.use(express.json()); // JSONパーサーはここで設定（POSTデータ取得に必要）

// LINE Webhookエンドポイント設定
app.post('/callback', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      try {
        const gptResponse = await openai.chat.completions.create({
          messages: [{ role: 'user', content: userMessage }],
          model: 'gpt-3.5-turbo', // 課金ユーザーはここをgpt-4に変更する
        });

        const replyText = gptResponse.choices[0].message.content.trim();

        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText,
        });
      } catch (error) {
        console.error('OpenAI APIエラー:', error);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'エラーが発生しました。もう一度お試しください。',
        });
      }
    }
  }

  res.status(200).end();
});

// Renderのポート設定
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
