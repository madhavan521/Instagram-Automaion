require('dotenv').config();
console.log('--- ENV CHECK ---');
console.log('TELEGRAM_BOT_TOKEN set:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
console.log('GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
console.log('GROQ_API_KEY set:', !!process.env.GROQ_API_KEY);
console.log('------------------');
