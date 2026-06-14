const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    fs.writeFileSync('available_models.json', JSON.stringify(response.data, null, 2));
    console.log("Full model list saved to available_models.json");
  } catch (err) {
    console.error("Error listing models:", err.response ? err.response.status : err.message);
    if (err.response) fs.writeFileSync('error_response.json', JSON.stringify(err.response.data, null, 2));
  }
}

listAllModels();
