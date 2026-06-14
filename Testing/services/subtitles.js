const fs = require('fs-extra');
const path = require('path');

/**
 * Converts word boundary events to an SRT file.
 * @param {Array} boundaries - Array of boundary events { audioOffset, text, duration }.
 * @param {string} fileName - Output file name.
 * @returns {Promise<string>} - Path to the generated SRT file.
 */
async function generateSRT(boundaries, fileName) {
  const srtPath = path.join(process.cwd(), 'temp', `${fileName}.srt`);
  
  let srtContent = '';
  boundaries.forEach((boundary, index) => {
    const startTime = formatSRTTime(boundary.audioOffset / 10000); // Ticks to ms
    const duration = boundary.duration / 10000;
    const endTime = formatSRTTime((boundary.audioOffset / 10000) + (duration > 0 ? duration : 500));
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${boundary.text}\n\n`;
  });

  await fs.writeFile(srtPath, srtContent);
  return srtPath;
}

function formatSRTTime(ms) {
  const date = new Date(ms);
  const hours = Math.floor(ms / 3600000).toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

module.exports = { generateSRT };
