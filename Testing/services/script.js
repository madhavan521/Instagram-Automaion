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
              content: "You are an expert software engineer, tech educator, and content creator. Return the result in valid JSON format."
            },
            {
              role: "user",
              content: `Create a highly engaging short-form video script for Instagram Reels.

Requirements:

1. The script must be EXACTLY 150-170 words.
2. The script must be written entirely in ${language}.
3. The script must be optimized for 55-60 seconds of speaking time.
4. Start with a strong hook in the first sentence.
5. Explain the topic in a simple, beginner-friendly way.
6. Use real-world examples whenever possible.
7. Keep the tone energetic and educational.
8. Avoid filler words and unnecessary introductions.
9. Do NOT include scene directions, timestamps, emojis, hashtags, or formatting.
10. Do NOT include phrases such as "Like and Follow", "Subscribe", "Thanks for watching", or logo endings.
11. The voiceover must continue naturally until the final sentence and fully utilize the available time.

The topic may belong to any of these categories:

* HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express.js, MongoDB, Firebase
* Git & GitHub, APIs, Authentication, Web Security, System Design, Cloud Computing, AWS, GCP
* Docker, CI/CD, DSA, SQL, Career Guidance, Interview Questions, Project Ideas, Startup Engineering
* AI for Developers, Software Engineering Best Practices

If the topic is:
* a comparison, explain both sides and conclude with when to use each.
* an interview question, explain the answer clearly and professionally.
* a roadmap, provide a step-by-step learning path.
* a mistake-based topic, explain the mistake and its solution.
* a system-design topic, explain the architecture in a simplified manner.
* a project topic, explain what to build, required technologies, and learning outcomes.

Also generate:
* A short Instagram caption (max 120 characters).
* 5 relevant hashtags.
* One English visual keyword suitable for image/video search.

Return ONLY valid JSON:
{
"script": "...",
"caption": "...",
"hashtags": ["...", "...", "...", "...", "..."],
"keyword": "..."
}

Topic: ${prompt}`
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
