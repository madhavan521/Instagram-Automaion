const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs-extra');

/**
 * Generates audio and word boundaries from text using Microsoft Edge TTS.
 * @param {string} text - The text to synthesize.
 * @param {string} fileName - The name for the output mp3 file.
 * @param {string} voiceName - The voice code to use (e.g., 'ta-IN-PallaviNeural').
 * @returns {Promise<{audioPath: string, wordBoundaries: Array}>} - The path to audio and timing info.
 */
async function generateVoice(text, fileName, voiceName = "en-US-AvaNeural") {
  const tts = new MsEdgeTTS();
  
  console.log(`TTS Voice: ${voiceName}`);
  
  // Enable word boundaries
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true
  });
  
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.ensureDir(tempDir);
  const targetAudioPath = path.join(tempDir, `${fileName}.mp3`);

  // Use toStream to avoid the buggy convenience method toFile() 
  // which crashes on Windows when no metadata is returned.
  const { audioStream, metadataStream } = await tts.toStream(text);
  
  const audioWriter = fs.createWriteStream(targetAudioPath);
  audioStream.pipe(audioWriter);
  
  let wordBoundaries = [];
  const metadataItems = { Metadata: [] };

  if (metadataStream) {
    metadataStream.on("data", (chunk) => {
      try {
        const chunkObj = JSON.parse(chunk.toString());
        if (chunkObj && chunkObj.Metadata) {
          metadataItems.Metadata.push(...chunkObj.Metadata);
        }
      } catch (e) {
        // Silently ignore parse errors for partial chunks
      }
    });
  }

  return new Promise((resolve, reject) => {
    let audioDone = false;
    let metadataDone = !metadataStream;

    const checkDone = () => {
      if (audioDone && metadataDone) {
        console.log(`TTS Complete: Audio ready at ${targetAudioPath}`);
        // Map word boundaries
        wordBoundaries = metadataItems.Metadata
          .filter(m => m.Type === "WordBoundary")
          .map(m => ({
            audioOffset: m.Data.Offset,
            text: m.Data.text.Text,
            duration: m.Data.Duration
          }));
        
        console.log(`Word boundaries generated: ${wordBoundaries.length}`);
          
        resolve({
          audioPath: targetAudioPath,
          wordBoundaries: wordBoundaries
        });
      }
    };

    audioWriter.on("finish", () => {
      audioDone = true;
      checkDone();
    });

    if (metadataStream) {
      const metadataTimeout = setTimeout(() => {
        if (!metadataDone) {
          console.log("Metadata stream timed out - continuing with collected data.");
          metadataDone = true;
          checkDone();
        }
      }, 10000); // 10s safety timeout

      metadataStream.on("end", () => {
        clearTimeout(metadataTimeout);
        metadataDone = true;
        checkDone();
      });
      metadataStream.on("error", (err) => {
        clearTimeout(metadataTimeout);
        console.error("Metadata stream error:", err.message);
        metadataDone = true; // Still proceed with audio
        checkDone();
      });
    }

    audioStream.on("error", reject);
    audioWriter.on("error", reject);
  });
}

module.exports = { generateVoice };
