const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadImages() {
  const targetDir = path.join(process.cwd(), 'assets', 'backgrounds');
  await fs.ensureDir(targetDir);

  const imageUrls = [
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1080&h=1920&auto=format&fit=crop', // Woman with microphone
    'https://images.unsplash.com/photo-1478737270239-2fccd27ee8bc?q=80&w=1080&h=1920&auto=format&fit=crop', // Podcast setup/Person
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1080&h=1920&auto=format&fit=crop', // Man speaking
    'https://images.unsplash.com/photo-1527224857830-43a7acc85360?q=80&w=1080&h=1920&auto=format&fit=crop', // Speaker at event
    'https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=1080&h=1920&auto=format&fit=crop'  // Person in studio
  ];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      console.log(`Downloading background ${i + 1}...`);
      const response = await axios({
        method: 'get',
        url: imageUrls[i],
        responseType: 'stream'
      });
      const filePath = path.join(targetDir, `bg_${i + 1}.jpg`);
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log(`Finished bg_${i + 1}.jpg`);
    } catch (err) {
      console.error(`Failed to download image ${i + 1}:`, err.message);
    }
  }
}

downloadImages();
