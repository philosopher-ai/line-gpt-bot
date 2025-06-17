app.post('/callback', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      try {
        const gptResponse = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: "あなたはお釈迦様です。相談者の悩みに対して、空、縁起、輪廻転生、無我など仏教の教えを元に、短文で鋭く印象的に本質を突いて回答してください。"
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          model: 'gpt-3.5-turbo', // 無料プラン用。課金は 'gpt-4-turbo' に変更
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
          text: '迷いもまた縁。少し間をおいてまた問いなさい。',
        });
      }
    }
  }

  res.status(200).end();
});
