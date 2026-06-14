const { MsEdgeTTS } = require('msedge-tts');

async function listVoices() {
    const tts = new MsEdgeTTS();
    const voices = await tts.getVoices();
    // Filter to show some common ones like English, Tamil, Hindi, etc.
    const interesting = voices.filter(v => 
        v.Name.includes("Hindi") || 
        v.Name.includes("Tamil") || 
        v.Name.includes("English") || 
        v.Name.includes("Telugu") ||
        v.Name.includes("Malayalam")
    );
    console.log(JSON.stringify(interesting.map(v => ({ FriendlyName: v.FriendlyName, Name: v.ShortName })), null, 2));
}

listVoices();
