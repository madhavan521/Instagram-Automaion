const axios = require('axios');
require('dotenv').config();

async function testFinal() {
  const apiKey = process.env.GEMINI_API_KEY;
  // Based on available_models.json, let's try gemini-2.0-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "Write a 1 sentence test script." }] }]
    });
    console.log("SUCCESS:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.log("FAILED:", err.response ? JSON.stringify(err.response.data) : err.message);
  }
}
testFinal();
