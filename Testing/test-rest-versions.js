const axios = require('axios');
require('dotenv').config();

async function testRest(version, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "hi" }] }]
    });
    console.log(`OK:${version}:${model}`);
  } catch (err) {
    console.log(`ERR:${version}:${model}:${err.response ? err.response.status : 'NO_RES'}`);
  }
}

async function run() {
  await testRest('v1', 'gemini-1.5-flash');
  await testRest('v1beta', 'gemini-1.5-flash');
  await testRest('v1', 'gemini-pro');
  await testRest('v1beta', 'gemini-pro');
}
run();
