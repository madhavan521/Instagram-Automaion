const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
const fs = require("fs");

const firebaseConfig = {
  apiKey: "AIzaSyBOCubnFnmlbCnHysTirMZCjZhIaNthQeE",
  authDomain: "blog-site-69e44.firebaseapp.com",
  projectId: "blog-site-69e44",
  storageBucket: "blog-site-69e44.firebasestorage.app",
  messagingSenderId: "478306654626",
  appId: "1:478306654626:web:710725909bb8b567617afb",
  measurementId: "G-E2YZVZZZ1G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function upload() {
  try {
    const rawData = fs.readFileSync("question.json", "utf8");
    const parsedData = JSON.parse(rawData);
    const data = parsedData.map((item, index) => ({ ...item, order: index + 1 }));

    console.log(`Found ${data.length} topics. Uploading to Firestore 'topics' collection...`);
    
    let count = 0;
    for (const item of data) {
      if (item.topic == null) continue;
      
      // Use the 'id' as the document ID so we don't create duplicates if run twice
      const docRef = doc(db, "topics", item.id.toString());
      await setDoc(docRef, {
        id: item.id,
        topic: item.topic,
        order: item.order,
        process: false  // New variable as requested
      });
      
      count++;
      if (count % 50 === 0) {
        console.log(`Uploaded ${count}/${data.length}...`);
      }
    }
    
    console.log(`\n✅ Successfully uploaded all ${count} topics to Firestore with process=false!`);
    process.exit(0);
  } catch (error) {
    console.error("Upload failed:", error);
    process.exit(1);
  }
}

upload();
