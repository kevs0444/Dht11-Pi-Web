// DHT11 Monitor JavaScript
let isLoading = false;

/**
 * Fetch current sensor data from the API
 */
async function fetchSensorData() {
    if (isLoading) return;
    
    isLoading = true;
    document.body.classList.add('loading');
    
    try {
        const response = await fetch('/api/current');
        const data = await response.json();
        
        if (data.success) {
            updateCurrentReadings(data);
            updateSensorStatus(true);
            await loadStats();
        } else {
            throw new Error('Sensor reading failed');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        updateSensorStatus(false);
    } finally {
        isLoading = false;
        document.body.classList.remove('loading');
    }
}

/**
 * Update the current temperature and humidity display
 */
function updateCurrentReadings(data) {
    const tempElement = document.getElementById('temperature');
    const humidityElement = document.getElementById('humidity');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    if (tempElement) {
        tempElement.textContent = data.temperature + '°';
    }
    
    if (humidityElement) {
        humidityElement.textContent = data.humidity + '%';
    }
    
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = `Last updated: ${data.timestamp}`;
    }
}

/**
 * Update sensor status indicator
 */
function updateSensorStatus(isOnline) {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;
    
    if (isOnline) {
        statusElement.className = 'status online';
        statusElement.textContent = '✅ Sensor Online';
    } else {
        statusElement.className = 'status offline';
        statusElement.textContent = '❌ Sensor Offline';
    }
}

/**
 * Load and display historical statistics
 */
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        if (!stats.error) {
            showStatsSection();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Stats loading error:', error);
    }
}

/**
 * Show the statistics section
 */
function showStatsSection() {
    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        statsSection.style.display = 'block';
    }
}

/**
 * Update statistics display with new data
 */
function updateStatsDisplay(stats) {
    // Temperature statistics
    updateElement('tempMin', stats.temperature.min + '°');
    updateElement('tempMax', stats.temperature.max + '°');
    updateElement('tempAvg', stats.temperature.avg + '°');
    
    // Humidity statistics
    updateElement('humidityMin', stats.humidity.min + '%');
    updateElement('humidityMax', stats.humidity.max + '%');
    updateElement('humidityAvg', stats.humidity.avg + '%');
}

/**
 * Helper function to update element text content
 */
function updateElement(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchSensorData);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Press 'R' to refresh
        if (event.key === 'r' || event.key === 'R') {
            if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                event.preventDefault();
                fetchSensorData();
            }
        }
    });
}

/**
 * Set up auto-refresh interval
 */
function setupAutoRefresh() {
    // Auto-refresh every 30 seconds
    setInterval(() => {
        console.log('Auto-refreshing sensor data...');
        fetchSensorData();
    }, 30000);
}

/**
 * Display connection status on page load
 */
function showInitialStatus() {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.className = 'status offline';
        statusElement.textContent = '🔄 Connecting to sensor...';
    }
}

/**
 * Initialize the application
 */
function initApp() {
    console.log('DHT11 Monitor initializing...');
    
    showInitialStatus();
    initializeEventListeners();
    setupAutoRefresh();
    
    // Initial data load
    fetchSensorData();
    
    console.log('DHT11 Monitor ready! Press "R" to manually refresh.');
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}