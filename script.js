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
const db = firebase.database();

let lastDataTime = 0;
let isConnected = false;
let connectionCheckInterval;
let firebaseConnected = true;
let hasReceivedData = false;
let lastNotificationTime = 0;
let wasOfflineNotified = false;

// Theme management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    localStorage.setItem('theme', newTheme);
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('themeIcon').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Welcome modal
function closeWelcome() {
    document.getElementById('welcomeModal').classList.add('hidden');
}

// Show notification
function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    const content = document.getElementById('notificationContent');
    
    let iconClass = 'exclamation-triangle';
    if (type === 'success') iconClass = 'check-circle';
    else if (type === 'warning') iconClass = 'info-circle';
    else if (type === 'error') iconClass = 'exclamation-triangle';
    
    content.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${iconClass}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.className = `notification ${type} show`;
    
    // Auto-hide notification after 4 seconds for success, 6 seconds for others
    const hideDelay = type === 'success' ? 4000 : 6000;
    setTimeout(() => {
        notification.classList.remove('show');
    }, hideDelay);
}

// Update status indicator
function updateStatus(online) {
    const indicator = document.getElementById('statusIndicator');
    const currentTime = Date.now();
    
    if (online && !isConnected) {
        // Sensor just came online
        indicator.className = 'status-indicator status-online';
        indicator.innerHTML = '<i class="fas fa-wifi"></i> Sensor Online';
        isConnected = true;
        
        // Show "back online" notification if it was previously offline
        if (wasOfflineNotified && hasReceivedData) {
            showNotification('✅ Sensor is back online and sending data!', 'success');
            wasOfflineNotified = false;
        }
        
    } else if (!online && isConnected) {
        // Sensor just went offline
        indicator.className = 'status-indicator status-offline';
        indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Sensor Offline';
        isConnected = false;
        
        // Only show offline notification if enough time has passed since last notification
        if (currentTime - lastNotificationTime > 30000) { // 30 seconds cooldown
            showNotification('⚠️ Sensor stopped sending data. Check your device.', 'error');
            lastNotificationTime = currentTime;
            wasOfflineNotified = true;
        }
    }
}

// Format timestamp
function formatTimestamp(unixTime) {
    const date = new Date(unixTime * 1000);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Check connection status
function checkConnection() {
    const now = Date.now() / 1000;
    const timeDiff = now - lastDataTime;
    
    // More aggressive checking for faster response
    // Mark as offline if no data received for more than 30 seconds (reduced from 60)
    if (hasReceivedData && timeDiff > 30 && isConnected) {
        updateStatus(false);
    }
    
    // If data is very old (5+ minutes), definitely offline
    if (hasReceivedData && timeDiff > 300 && isConnected) {
        updateStatus(false);
    }
}

// Listen for Firebase connection status
db.ref('.info/connected').on('value', (snapshot) => {
    firebaseConnected = snapshot.val();
    
    // Only show database connection warnings if we've received data before
    // and the sensor should be active but Firebase is disconnected
    if (!firebaseConnected && hasReceivedData && isConnected) {
        showNotification('Database connection interrupted', 'warning');
    }
});

// Listen for sensor data changes
db.ref("sensor_data").on("value", (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        const newDataTime = data.timestamp;
        
        // Check if this is actually new data
        const isNewData = newDataTime > lastDataTime;
        lastDataTime = newDataTime;
        hasReceivedData = true;
        
        // Update UI elements
        document.getElementById("temperature").textContent = data.temperature;
        document.getElementById("humidity").textContent = data.humidity;
        document.getElementById("timestamp").textContent = "Last updated: " + formatTimestamp(data.timestamp);
        
        // Update connection status (this will trigger notifications if status changed)
        updateStatus(true);
        
        // Only check for extreme values on new data
        if (isNewData) {
            if (data.temperature > 35) {
                showNotification(`🌡️ High temperature alert: ${data.temperature}°C`, 'warning');
            } else if (data.temperature < 0) {
                showNotification(`🥶 Low temperature alert: ${data.temperature}°C`, 'warning');
            }
            
            if (data.humidity > 80) {
                showNotification(`💧 High humidity alert: ${data.humidity}%`, 'warning');
            }
        }
        
    } else {
        console.log("No data found in Firebase.");
        // Only show offline status if Firebase is connected but no data exists
        if (firebaseConnected) {
            updateStatus(false);
        }
    }
}, (error) => {
    console.error("Error reading Firebase:", error);
    showNotification("❌ Database connection error", 'error');
    updateStatus(false);
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    
    // Start connection monitoring - check more frequently for faster response
    connectionCheckInterval = setInterval(checkConnection, 15000); // Check every 15 seconds (reduced from 30)
    
    // Auto-close welcome modal after 10 seconds if user doesn't interact
    setTimeout(() => {
        if (!document.getElementById('welcomeModal').classList.contains('hidden')) {
            closeWelcome();
        }
    }, 10000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
});
