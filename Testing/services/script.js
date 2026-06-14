const axios = require("axios");
require("dotenv").config();

/**
 * Generates a viral video script and a visual keyword based on a prompt using Groq.
 * @param {string} prompt - The user's input/prompt.
 * @param {string} language - The language for the script (e.g., 'Tamil', 'Hindi', 'English').
 * @returns {Promise<{script: string, keyword: string}>} - The generated script and keyword.
 */
async function generateScript(prompt, language = "English") {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }

  // Recommended Groq models
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
  ];
  
  let lastError = null;

  for (const model of models) {
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const url = `https://api.groq.com/openai/v1/chat/completions`;
        
        const response = await axios.post(url, {
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an expert MERN stack developer and educator. Return the result in valid JSON format."
            },
            {
              role: "user",
              content: `1. Write a high-value tutorial script that lasts around 58 seconds when spoken (EXACTLY 155-165 words) about the topic requested. 
              The script MUST be written entirely in ${language}.
              Focus on clear explanations for HTML, CSS, Javascript, React, Node.js, Express, or MongoDB.
              Format as a single paragraph of spoken text for a voiceover.
              
              2. CRITICAL: The voiceover must be continuous and engaging, filling the entire time. Do not include any instructions for silence or logos at the end.
              
              3. Provide a 1-word visual keyword in English that represents the specific technical theme.
              
              Return ONLY the result in this JSON format:
              { "script": "...", "keyword": "..." }
              
              Prompt/Topic: ${prompt}`
            }
          ],
          response_format: { type: "json_object" }
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data?.choices?.[0]?.message?.content) {
          const rawOutput = response.data.choices[0].message.content;
          return JSON.parse(rawOutput);
        }
      } catch (error) {
         lastError = error;
         const status = error.response?.status;
         const errorCode = error.response?.data?.error?.code || error.message;
         console.error(`Groq Error (${model}):`, status || errorCode);
         
         if (status === 429) {
           // Exponential backoff: 5s, 10s...
           const waitTime = (retries + 1) * 5000;
           console.log(`Groq Rate limited (429). Waiting ${waitTime/1000}s before retry...`);
           await new Promise(resolve => setTimeout(resolve, waitTime));
           retries++;
           continue; 
         }
         
         if (status === 404 || status === 400) {
           break; // Model issues or bad request, skip to next model
         }
         
         break; // Other error, skip to next model
      }
    }
  }

  throw new Error(`Groq failed to generate content. Last error: ${lastError?.response?.status || lastError?.message}`);
}

module.exports = { generateScript };
