class GPSLifeTrackerApp {
    constructor() {
        this.currentTab = 'tracking';
        this.isInitialized = false;
        this.notifications = new NotificationManager();
        
        this.init();
    }
    
    async init() {
        console.log('Initializing GPS Life Tracker App...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    async initializeApp() {
        try {
            // Hide loading overlay
            this.hideLoading();
            
            // Initialize components
            await this.initializeEventListeners();
            await this.initializeGPSTracker();
            await this.initializeDataStorage();
            await this.loadSettings();
            
            // Setup URL routing
            this.setupRouting();
            
            // Initialize tab views
            this.initializeTabViews();
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            
            console.log('GPS Life Tracker App initialized successfully');
            this.notifications.show('GPS Life Tracker ready!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.notifications.show('Failed to initialize app: ' + error.message, 'error');
        }
    }
    
    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Tracking controls
        const startBtn = document.getElementById('start-tracking');
        const stopBtn = document.getElementById('stop-tracking');
        const exportBtn = document.getElementById('export-data');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTracking());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTracking());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Map controls
        const centerMapBtn = document.getElementById('center-map');
        const toggleRouteBtn = document.getElementById('toggle-route');
        const toggleHeatmapBtn = document.getElementById('toggle-heatmap');
        
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => this.centerMapOnLocation());
        }
        
        if (toggleRouteBtn) {
            toggleRouteBtn.addEventListener('click', () => this.toggleRouteDisplay());
        }
        
        if (toggleHeatmapBtn) {
            toggleHeatmapBtn.addEventListener('click', () => this.toggleHeatmapDisplay());
        }
        
        // Timeline controls
        const timelineDateInput = document.getElementById('timeline-date');
        const todayBtn = document.getElementById('today-btn');
        
        if (timelineDateInput) {
            timelineDateInput.addEventListener('change', (e) => {
                this.loadTimelineData(new Date(e.target.value));
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                const today = new Date();
                timelineDateInput.value = today.toISOString().split('T')[0];
                this.loadTimelineData(today);
            });
        }
        
        // Settings controls
        this.initializeSettingsControls();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Visibility change (for background tracking)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Window beforeunload (to save data)
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    }
    
    initializeSettingsControls() {
        const updateIntervalSelect = document.getElementById('update-interval');
        const highAccuracyCheckbox = document.getElementById('high-accuracy');
        const backgroundTrackingCheckbox = document.getElementById('background-tracking');
        const autoSyncCheckbox = document.getElementById('auto-sync');
        const dataRetentionSelect = document.getElementById('data-retention');
        const clearDataBtn = document.getElementById('clear-data');
        
        // Update interval
        if (updateIntervalSelect) {
            updateIntervalSelect.addEventListener('change', (e) => {
                this.updateGPSSettings({ updateInterval: parseInt(e.target.value) * 1000 });
            });
        }
        
        // High accuracy
        if (highAccuracyCheckbox) {
            highAccuracyCheckbox.addEventListener('change', (e) => {
                this.updateGPSSettings({ highAccuracy: e.target.checked });
            });
        }
        
        // Background tracking
        if (backgroundTrackingCheckbox) {
            backgroundTrackingCheckbox.addEventListener('change', (e) => {
                this.updateSetting('backgroundTracking', e.target.checked);
            });
        }
        
        // Auto sync
        if (autoSyncCheckbox) {
            autoSyncCheckbox.addEventListener('change', (e) => {
                this.updateSetting('autoSync', e.target.checked);
            });
        }
        
        // Data retention
        if (dataRetentionSelect) {
            dataRetentionSelect.addEventListener('change', (e) => {
                this.updateSetting('dataRetention', parseInt(e.target.value));
            });
        }
        
        // Clear data
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }
    }
    
    async initializeGPSTracker() {
        if (!window.gpsTracker) {
            throw new Error('GPS Tracker not available');
        }
        
        // Set up callbacks
        window.gpsTracker.onLocationUpdate = (location) => this.handleLocationUpdate(location);
        window.gpsTracker.onTrackingStart = () => this.handleTrackingStart();
        window.gpsTracker.onTrackingStop = (session) => this.handleTrackingStop(session);
        window.gpsTracker.onError = (error) => this.handleGPSError(error);
    }
    
    async initializeDataStorage() {
        if (!window.dataStorage) {
            throw new Error('Data Storage not available');
        }
        
        // Wait for database to be ready
        let retries = 0;
        while (!window.dataStorage.ready && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.dataStorage.ready) {
            throw new Error('Data Storage failed to initialize');
        }
    }
    
    setupRouting() {
        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle tab parameter
        const tab = urlParams.get('tab');
        if (tab && ['tracking', 'map', 'timeline', 'stats', 'settings'].includes(tab)) {
            this.switchTab(tab);
        }
        
        // Handle action parameter
        const action = urlParams.get('action');
        if (action === 'start-tracking') {
            this.startTracking();
        }
        
        // Handle coordinates parameter (for geo: protocol)
        const coordinates = urlParams.get('coordinates');
        if (coordinates) {
            this.handleGeoProtocol(coordinates);
        }
    }
    
    initializeTabViews() {
        // Initialize map view
        if (window.mapView) {
            window.mapView.initialize('map');
        }
        
        // Initialize timeline view
        if (window.timelineView) {
            window.timelineView.initialize();
        }
        
        // Set today's date in timeline
        const timelineDateInput = document.getElementById('timeline-date');
        if (timelineDateInput) {
            timelineDateInput.value = new Date().toISOString().split('T')[0];
        }
    }
    
    async loadSettings() {
        if (!window.dataStorage) return;
        
        try {
            // Load GPS settings
            const gpsSettings = await window.dataStorage.getSetting('gpsSettings', {});
            if (Object.keys(gpsSettings).length > 0 && window.gpsTracker) {
                window.gpsTracker.updateSettings(gpsSettings);
            }
            
            // Load UI settings
            const backgroundTracking = await window.dataStorage.getSetting('backgroundTracking', true);
            const autoSync = await window.dataStorage.getSetting('autoSync', false);
            const dataRetention = await window.dataStorage.getSetting('dataRetention', 365);
            
            // Apply settings to UI
            this.applySettingsToUI({
                backgroundTracking,
                autoSync,
                dataRetention,
                ...gpsSettings
            });
            
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    applySettingsToUI(settings) {
        // Update interval
        const updateIntervalSelect = document.getElementById('update-interval');
        if (updateIntervalSelect && settings.updateInterval) {
            updateIntervalSelect.value = settings.updateInterval / 1000;
        }
        
        // High accuracy
        const highAccuracyCheckbox = document.getElementById('high-accuracy');
        if (highAccuracyCheckbox && typeof settings.highAccuracy === 'boolean') {
            highAccuracyCheckbox.checked = settings.highAccuracy;
        }
        
        // Background tracking
        const backgroundTrackingCheckbox = document.getElementById('background-tracking');
        if (backgroundTrackingCheckbox && typeof settings.backgroundTracking === 'boolean') {
            backgroundTrackingCheckbox.checked = settings.backgroundTracking;
        }
        
        // Auto sync
        const autoSyncCheckbox = document.getElementById('auto-sync');
        if (autoSyncCheckbox && typeof settings.autoSync === 'boolean') {
            autoSyncCheckbox.checked = settings.autoSync;
        }
        
        // Data retention
        const dataRetentionSelect = document.getElementById('data-retention');
        if (dataRetentionSelect && settings.dataRetention) {
            dataRetentionSelect.value = settings.dataRetention;
        }
    }
    
    async loadInitialData() {
        try {
            // Load statistics
            await this.loadStatistics();
            
            // Load storage info
            await this.updateStorageInfo();
            
            // Load today's timeline
            await this.loadTimelineData(new Date());
            
            // Load recent locations on map
            if (window.mapView) {
                const recentLocations = await window.dataStorage.getRecentLocations(100);
                window.mapView.displayLocations(recentLocations);
            }
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }
    
    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabBtn && tabContent) {
            tabBtn.classList.add('active');
            tabContent.classList.add('active');
            this.currentTab = tabName;
            
            // Handle tab-specific initialization
            this.handleTabSwitch(tabName);
        }
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.replaceState({}, '', url);
    }
    
    handleTabSwitch(tabName) {
        switch (tabName) {
            case 'map':
                if (window.mapView) {
                    window.mapView.resize();
                    this.centerMapOnLocation();
                }
                break;
                
            case 'timeline':
                this.loadTimelineData(new Date());
                break;
                
            case 'stats':
                this.loadStatistics();
                break;
                
            case 'settings':
                this.updateStorageInfo();
                break;
        }
    }
    
    async startTracking() {
        try {
            if (!window.gpsTracker) {
                throw new Error('GPS Tracker not available');
            }
            
            await window.gpsTracker.startTracking();
            
        } catch (error) {
            console.error('Failed to start tracking:', error);
            this.notifications.show('Failed to start tracking: ' + error.message, 'error');
        }
    }
    
    async stopTracking() {
        try {
            if (!window.gpsTracker) {
                throw new Error('GPS Tracker not available');
            }
            
            window.gpsTracker.stopTracking();
            
        } catch (error) {
            console.error('Failed to stop tracking:', error);
            this.notifications.show('Failed to stop tracking: ' + error.message, 'error');
        }
    }
    
    handleLocationUpdate(location) {
        // Update map if visible
        if (this.currentTab === 'map' && window.mapView) {
            window.mapView.updateCurrentLocation(location);
        }
        
        console.log('Location updated:', location.latitude, location.longitude);
    }
    
    handleTrackingStart() {
        // Update UI
        const startBtn = document.getElementById('start-tracking');
        const stopBtn = document.getElementById('stop-tracking');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        console.log('Tracking started');
    }
    
    async handleTrackingStop(session) {
        // Update UI
        const startBtn = document.getElementById('start-tracking');
        const stopBtn = document.getElementById('stop-tracking');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        
        // Refresh data views
        await this.loadStatistics();
        await this.loadTimelineData(new Date());
        
        this.notifications.show(`Tracking session completed: ${(session.distance / 1000).toFixed(2)} km`, 'success');
        
        console.log('Tracking stopped:', session);
    }
    
    handleGPSError(error) {
        console.error('GPS Error:', error);
        this.notifications.show('GPS Error: ' + error.message, 'error');
    }
    
    async loadStatistics() {
        try {
            if (!window.dataStorage) return;
            
            const stats = await window.dataStorage.getStatistics();
            if (!stats) return;
            
            // Update statistics display
            const elements = {
                'total-distance-stat': (stats.totalDistance || 0).toFixed(1) + ' km',
                'tracking-days-stat': stats.trackingDays || 0,
                'total-time-stat': this.formatDuration(stats.totalDuration || 0),
                'top-speed-stat': (stats.topSpeed || 0).toFixed(1) + ' km/h'
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }
    
    async loadTimelineData(date) {
        try {
            if (!window.dataStorage) return;
            
            const locations = await window.dataStorage.getLocationsByDate(date);
            
            if (window.timelineView) {
                window.timelineView.displayTimelineData(locations, date);
            }
            
        } catch (error) {
            console.error('Failed to load timeline data:', error);
        }
    }
    
    async updateStorageInfo() {
        try {
            if (!window.dataStorage) return;
            
            const [storageSize, stats] = await Promise.all([
                window.dataStorage.getStorageSize(),
                window.dataStorage.getStatistics()
            ]);
            
            const usedElement = document.getElementById('storage-used');
            const pointsElement = document.getElementById('total-points');
            
            if (usedElement) {
                usedElement.textContent = window.dataStorage.formatBytes(storageSize.used);
            }
            
            if (pointsElement && stats) {
                pointsElement.textContent = stats.totalPoints || 0;
            }
            
        } catch (error) {
            console.error('Failed to update storage info:', error);
        }
    }
    
    async exportData() {
        try {
            if (!window.gpsTracker) return;
            
            const status = window.gpsTracker.getTrackingStatus();
            if (status.session.points.length === 0) {
                this.notifications.show('No data to export', 'warning');
                return;
            }
            
            // Default to GPX format
            window.gpsTracker.exportData('gpx');
            
        } catch (error) {
            console.error('Failed to export data:', error);
            this.notifications.show('Failed to export data: ' + error.message, 'error');
        }
    }
    
    async centerMapOnLocation() {
        try {
            if (!window.mapView || !window.gpsTracker) return;
            
            const lastPosition = window.gpsTracker.getLastPosition();
            if (lastPosition) {
                window.mapView.centerOnLocation(lastPosition.latitude, lastPosition.longitude);
            } else {
                // Try to get current location
                const position = await window.gpsTracker.getCurrentLocation();
                window.mapView.centerOnLocation(position.coords.latitude, position.coords.longitude);
            }
            
        } catch (error) {
            console.error('Failed to center map:', error);
            this.notifications.show('Failed to center map on location', 'error');
        }
    }
    
    toggleRouteDisplay() {
        if (window.mapView) {
            window.mapView.toggleRouteDisplay();
        }
    }
    
    toggleHeatmapDisplay() {
        if (window.mapView) {
            window.mapView.toggleHeatmapDisplay();
        }
    }
    
    async updateGPSSettings(settings) {
        if (window.gpsTracker) {
            window.gpsTracker.updateSettings(settings);
            
            // Save to storage
            if (window.dataStorage) {
                await window.dataStorage.saveSetting('gpsSettings', window.gpsTracker.getSettings());
            }
        }
    }
    
    async updateSetting(key, value) {
        if (window.dataStorage) {
            await window.dataStorage.saveSetting(key, value);
        }
    }
    
    async clearAllData() {
        const confirmed = confirm('Are you sure you want to clear all tracking data? This action cannot be undone.');
        
        if (confirmed && window.dataStorage) {
            try {
                await window.dataStorage.clearAllData();
                
                // Refresh all views
                await this.loadStatistics();
                await this.loadTimelineData(new Date());
                await this.updateStorageInfo();
                
                if (window.mapView) {
                    window.mapView.clearAllData();
                }
                
                this.notifications.show('All data cleared successfully', 'success');
                
            } catch (error) {
                console.error('Failed to clear data:', error);
                this.notifications.show('Failed to clear data: ' + error.message, 'error');
            }
        }
    }
    
    handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.switchTab('tracking');
                    break;
                case '2':
                    event.preventDefault();
                    this.switchTab('map');
                    break;
                case '3':
                    event.preventDefault();
                    this.switchTab('timeline');
                    break;
                case '4':
                    event.preventDefault();
                    this.switchTab('stats');
                    break;
                case '5':
                    event.preventDefault();
                    this.switchTab('settings');
                    break;
            }
        }
        
        // Space bar to start/stop tracking
        if (event.code === 'Space' && this.currentTab === 'tracking') {
            event.preventDefault();
            if (window.gpsTracker && window.gpsTracker.getTrackingStatus().isTracking) {
                this.stopTracking();
            } else {
                this.startTracking();
            }
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('App went to background');
        } else {
            console.log('App returned to foreground');
            // Refresh data when app returns to foreground
            this.refreshCurrentView();
        }
    }
    
    handleBeforeUnload() {
        // Save any pending data
        console.log('App is being closed, saving data...');
    }
    
    async refreshCurrentView() {
        switch (this.currentTab) {
            case 'timeline':
                const timelineDateInput = document.getElementById('timeline-date');
                if (timelineDateInput) {
                    await this.loadTimelineData(new Date(timelineDateInput.value));
                }
                break;
            case 'stats':
                await this.loadStatistics();
                break;
            case 'map':
                if (window.mapView) {
                    const recentLocations = await window.dataStorage.getRecentLocations(100);
                    window.mapView.displayLocations(recentLocations);
                }
                break;
        }
    }
    
    handleGeoProtocol(coordinates) {
        // Handle geo: protocol links
        try {
            const [lat, lng] = coordinates.split(',').map(parseFloat);
            if (window.mapView && !isNaN(lat) && !isNaN(lng)) {
                this.switchTab('map');
                window.mapView.centerOnLocation(lat, lng);
                window.mapView.addMarker(lat, lng, 'Shared Location');
            }
        } catch (error) {
            console.error('Failed to handle geo protocol:', error);
        }
    }
    
    formatDuration(hours) {
        const totalMinutes = Math.floor(hours * 60);
        const displayHours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${displayHours}h ${minutes}m`;
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Notification Manager
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        if (!this.container) {
            this.createContainer();
        }
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notifications';
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

// Initialize app when script loads
window.notifications = new NotificationManager();
window.app = new GPSLifeTrackerApp();