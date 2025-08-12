const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to the database
const db = firebase.database();

// Function to format timestamp
function formatTimestamp(unixTime) {
    const date = new Date(unixTime * 1000); // Firebase stores in seconds, JS needs ms
    return date.toLocaleString();
}

// Listen for changes in sensor_data
db.ref("sensor_data").on("value", (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();

        document.getElementById("temperature").innerText = data.temperature + " °C";
        document.getElementById("humidity").innerText = data.humidity + " %";
        document.getElementById("timestamp").innerText = "Last updated: " + formatTimestamp(data.timestamp);
    } else {
        console.log("No data found in Firebase.");
    }
}, (error) => {
    console.error("Error reading Firebase:", error);
});
