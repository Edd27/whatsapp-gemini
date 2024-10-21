export function containsAnyWord(text: string, wordList: string[]) {
  const pattern = new RegExp(wordList.join("|"), "i");
  return pattern.test(text);
}

export async function generateAnswerWithGemini(question: string) {
  const answer = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${process.env.GEMINI_CONTEXT}\n\nQuestion: ${question}\nAnswer:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    },
  )
    .then((res) => res.json())
    .then((data) => data.candidates[0]?.content.parts[0]?.text);

  return { answer };
}

export async function generateAnswerWithBotion(question: string) {
  const answer = await fetch(
    `https://botion.edgarbenavides.dev/api/chat-bots/${process.env.BOTION_CHATBOT_ID}/send-question`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": `${process.env.BOTION_API_KEY}`,
      },
      body: JSON.stringify({
        question,
      }),
    },
  )
    .then((res) => res.json())
    .then((data) => data.data);

  return { answer };
}
