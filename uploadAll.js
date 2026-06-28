require('dotenv').config();
const { publishYouTubeVideo } = require('./postReel.js');
const fs = require('fs');
const path = require('path');

const videos = [
  { file: "why Mern stack.mp4", caption: "Why Should You Learn the MERN Stack in 2026? 💻 #shorts #mern" },
  { file: "why mern.mp4", caption: "The Biggest Advantages of using MERN Stack 🔥 #shorts #reactjs" },
  { file: "mern used in startups.mp4", caption: "Why Tech Startups LOVE the MERN Stack 📈 #shorts #startups #coding" },
  { file: "mern job opportunity.mp4", caption: "MERN Stack Developer Job Opportunities & Salary 💰 #shorts #developer" },
  { file: "mern vs mean.mp4", caption: "MERN Stack vs MEAN Stack - Which is better? 🥊 #shorts #mern" },
  { file: "mern vs django.mp4", caption: "MERN Stack vs Django (Python) - My Honest Opinion 🐍 #shorts #django" },
  { file: "mern vs springboot.mp4", caption: "MERN Stack vs Spring Boot (Java) - Which should you choose? ☕ #shorts" },
  { file: "js in mern.mp4", caption: "The Role of JavaScript in the MERN Stack 🧠 #shorts #javascript" },
  { file: "what is js .mp4", caption: "What actually is JavaScript? JS Explained! 💛 #shorts #coding" },
  { file: "why javascript.mp4", caption: "Why JavaScript is the most important language to learn 🌎 #shorts" },
  { file: "data type.mp4", caption: "JavaScript Data Types Explained Easily 📊 #shorts #javascript" },
  { file: "varibales.mp4", caption: "How to use Variables in JavaScript 📦 #shorts #webdev" },
  { file: "var  const  let.mp4", caption: "var vs let vs const in JavaScript - What's the difference? ⚖️ #shorts" },
  { file: "primitive and refernce data type.mp4", caption: "Primitive vs Reference Data Types in JS 🧩 #shorts #javascript" },
  { file: "operators.mp4", caption: "Mastering JavaScript Operators ➕➖ #shorts #codingtips" },
  { file: "functions.mp4", caption: "How to write Functions in JavaScript ⚙️ #shorts #javascript" },
  { file: "function decoration and functionexpression .mp4", caption: "Function Declaration vs Function Expression in JS 📝 #shorts" },
  { file: "arrowfunction.mp4", caption: "JavaScript Arrow Functions explained in 60s 🏹 #shorts #reactjs" },
  { file: "array.mp4", caption: "Working with Arrays in JavaScript 📚 #shorts #javascript" },
  { file: "objects.mp4", caption: "JavaScript Objects Explained for Beginners 🏗️ #shorts #coding" },
  { file: "loops.mp4", caption: "How to use Loops in JavaScript 🔁 #shorts #webdevelopment" }
];

const basePath = path.join(__dirname, 'temp', 'mern_stack_tutorials');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadAll() {
  console.log(`Starting bulk upload for ${videos.length} videos...`);
  console.log('WARNING: YouTube has a daily upload limit (approx 6 videos per day on standard API). If you hit a Quota Exceeded error, you will have to run this again tomorrow.\n');

  for (let i = 0; i < videos.length; i++) {
    const videoObj = videos[i];
    const videoPath = path.join(basePath, videoObj.file);
    
    // Check if there is a .jpg with the same name
    const thumbnailPath = videoPath.replace('.mp4', '.jpg');
    let thumbToPass = null;
    
    if (fs.existsSync(videoPath)) {
      console.log(`\n[${i + 1}/${videos.length}] Uploading: ${videoObj.file}`);
      
      if (fs.existsSync(thumbnailPath)) {
         console.log(`Found matching thumbnail: ${path.basename(thumbnailPath)}`);
         thumbToPass = thumbnailPath;
      }
      
      try {
        const id = await publishYouTubeVideo(videoPath, videoObj.caption, thumbToPass);
        if (id) {
          console.log(`✅ Success! Video ID: ${id}`);
        }
        
        // Wait 10 seconds before the next upload to prevent rate limiting
        if (i < videos.length - 1) {
          console.log('Waiting 10 seconds before next upload...');
          await delay(10000);
        }
        
      } catch (err) {
        console.error(`❌ Failed to upload ${videoObj.file}.`);
        if (err.message && err.message.includes('quota')) {
          console.error("CRITICAL ERROR: YouTube API daily quota exceeded. You must wait until tomorrow to upload the rest.");
          break; // Stop the loop
        }
      }
    } else {
      console.log(`\n[${i + 1}/${videos.length}] ⏭️ Skipping ${videoObj.file} (File not found)`);
    }
  }
  
  console.log('\nBulk upload process completed.');
}

uploadAll();
