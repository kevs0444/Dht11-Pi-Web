// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyAGdcT7FLX_OMnw5TSsxCdONMJWthw3Rf0",
  authDomain: "raspi-dht-dashboard.firebaseapp.com",
  databaseURL: "https://raspi-dht-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "raspi-dht-dashboard",
  storageBucket: "raspi-dht-dashboard.firebasestorage.app",
  messagingSenderId: "396378078628",
  appId: "1:396378078628:web:25b432d525a09615599531",
  measurementId: "G-3KBFDMWR7R"
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