# 📍 GPS Life Tracker - Progressive Web App

A comprehensive GPS location tracking application that automatically documents your daily life journey with timeline views, interactive maps, and personal analytics - all while maintaining complete data ownership and privacy.

## ✨ Features

- **🎯 Real-time GPS Tracking** - Automatic location tracking with configurable intervals
- **🗺️ Interactive Maps** - Visualize your routes and locations with Leaflet.js
- **📅 Daily Timeline** - See chronological events, places visited, and movements
- **📊 Statistics Dashboard** - Track distance, time, and movement patterns
- **📱 Progressive Web App** - Install on your phone like a native app
- **🔒 Privacy-First** - All data stored locally, no external tracking
- **⚡ Offline Support** - Works without internet connection
- **📥 Data Export** - Export your data in GPX, CSV, or JSON formats

## 🚀 Quick Start

### 1. Setup
1. Copy all files to a web server or local development environment
2. Ensure HTTPS is enabled (required for GPS and Service Worker)
3. Open `index.html` in a modern web browser

### 2. Install as PWA
1. Visit the app in Chrome on your Android phone
2. Tap the "Add to Home Screen" prompt
3. Or manually: Chrome menu → "Install app"
4. The app will appear as an icon on your home screen

### 3. Start Tracking
1. Grant location permission when prompted
2. Tap "Start Tracking" on the main screen
3. The app will begin recording your location automatically
4. You can minimize the app - tracking continues in background

### 4. View Your Data
- **Map Tab**: See your current location and route visualization
- **Timeline Tab**: Browse daily activities and places visited
- **Stats Tab**: View tracking statistics and insights
- **Settings Tab**: Configure tracking preferences and manage data

## 📱 Mobile Installation Guide

### Android (Chrome/Samsung Internet)
1. Open the app URL in your mobile browser
2. Look for "Add to Home Screen" popup
3. Tap "Install" or "Add"
4. App icon will appear on your home screen
5. Open like any other app - no browser UI!

### iOS (Safari)
1. Open the app URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. App icon appears on your home screen

## 🛠 Technical Requirements

### Browser Support
- **Chrome/Chromium**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 11.3+)
- **Edge**: ✅ Full support

### Device Requirements
- **GPS/Location Services**: Required for tracking
- **HTTPS**: Required for GPS access and Service Worker
- **Modern JavaScript**: ES6+ support required
- **IndexedDB**: For local data storage
- **Service Worker**: For offline functionality

## 📂 Project Structure

```
RP_GPS_PWA/
├── index.html              # Main application interface
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline functionality
├── css/
│   └── styles.css         # Responsive styles
├── js/
│   ├── app.js             # Main application logic
│   ├── gps-tracker.js     # GPS tracking engine
│   ├── data-storage.js    # IndexedDB storage
│   ├── map-view.js        # Map visualization
│   └── timeline-view.js   # Timeline interface
├── icons/                 # PWA icons (to be added)
├── PRD.md                 # Product Requirements Document
└── README.md              # This file
```

## 🔧 Configuration

### GPS Settings
- **Update Interval**: 5-60 seconds (default: 10s)
- **High Accuracy**: Enable for better precision
- **Background Tracking**: Continue when app minimized

### Privacy Settings
- **Local Storage Only**: No data sent to external servers
- **Data Retention**: Configure how long to keep data
- **Export Options**: Backup your data anytime

### Performance Settings
- **Battery Optimization**: Automatic power management
- **Storage Management**: Automatic data compression
- **Offline Mode**: Works 7+ days without internet

## 📊 Data Export Formats

### GPX (GPS Exchange Format)
- Standard format for GPS applications
- Compatible with Google Earth, Garmin, etc.
- Includes waypoints and track data

### CSV (Comma Separated Values)
- Spreadsheet-compatible format
- Great for data analysis in Excel/Google Sheets
- Includes all location metadata

### JSON (JavaScript Object Notation)
- Complete data backup format
- Includes sessions, places, and settings
- Can be imported back into the app

## 🔒 Privacy & Security

### Data Ownership
- **100% Local Storage**: Your data never leaves your device by default
- **No Tracking**: No analytics or external data collection
- **No Accounts**: No registration or login required
- **Full Control**: Delete or export your data anytime

### Security Features
- **Client-side Only**: No server dependencies
- **Encrypted Exports**: Optional encryption for data files
- **Secure Storage**: Browser-level data protection
- **Open Source**: Transparent, auditable code

## 🐛 Troubleshooting

### Location Not Working
1. Check browser location permission
2. Ensure HTTPS is enabled
3. Make sure GPS is enabled on device
4. Try refreshing the page

### App Not Installing
1. Make sure you're using HTTPS
2. Check browser PWA support
3. Clear browser cache and try again
4. Manually add to home screen from browser menu

### Data Not Saving
1. Check browser storage permissions
2. Ensure sufficient device storage
3. Try clearing app data and restarting
4. Check browser IndexedDB support

### Performance Issues
1. Close other apps to free memory
2. Check device storage space
3. Reduce tracking frequency in settings
4. Clear old data or export and delete

## 🆘 Support

### Self-Help Resources
1. Check the troubleshooting section above
2. Review the PRD.md for detailed feature documentation
3. Check browser developer console for error messages
4. Try the app in different browsers

### Technical Details
- **GPS API**: Uses HTML5 Geolocation API
- **Storage**: IndexedDB for client-side data
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Offline**: Service Worker with cache-first strategy

## 🚀 Future Enhancements

### Planned Features
- **Cloud Sync**: Optional encrypted cloud backup
- **Advanced Analytics**: More detailed movement insights
- **Place Management**: Enhanced location categorization
- **Social Features**: Optional sharing capabilities
- **Integrations**: Connect with fitness apps and services

### Contributing
This is a personal project, but suggestions and improvements are welcome through the issue tracking system.

## 📜 License

This project is created for personal use. All location data remains private and under user control.

---

**Created with ❤️ by Claude Code**  
**Version 1.0.0 - January 2025**

Enjoy tracking your life journey! 🗺️✨