const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testModel(modelName) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    await model.generateContent("test");
    console.log(`OK:${modelName}`);
    return true;
  } catch (err) {
    console.log(`ERR:${modelName}`);
    return false;
  }
}
async function runTests() {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
  for (const m of models) await testModel(m);
}
runTests();
