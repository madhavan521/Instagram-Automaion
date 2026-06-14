const OpenAI = require("openai");
require("dotenv").config();

async function testOpenAICompatible() {
  const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      console.log(`Testing model: ${model}`);
      const response = await client.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: "hi" }]
      });
      console.log(`✅ Success with ${model}: ${response.choices[0].message.content}`);
      return;
    } catch (err) {
      console.log(`❌ Failed with ${model}: ${err.message}`);
    }
  }
}

testOpenAICompatible();
