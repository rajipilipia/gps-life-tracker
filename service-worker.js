const CACHE_NAME = 'gps-life-tracker-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Static assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/gps-tracker.js',
  '/js/data-storage.js',
  '/js/map-view.js',
  '/js/timeline-view.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Resources that can be cached dynamically
const DYNAMIC_CACHE_URLS = [
  '/api/',
  'https://api.mapbox.com/',
  'https://tile.openstreetmap.org/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    Promise.all([
      // Take control of all clients
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ])
  );
});

// Fetch event - handle requests with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAssetRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isMapTileRequest(request)) {
    event.respondWith(handleMapTileRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Handle navigation requests (pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);
    
    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to main app
    const appResponse = await caches.match('/');
    if (appResponse) {
      return appResponse;
    }
    
    // Last resort - offline page
    return caches.match(OFFLINE_URL) || new Response('Offline');
  }
}

// Handle static assets (CSS, JS, images)
async function handleStaticAssetRequest(request) {
  try {
    // Cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url, error);
    return new Response('Asset unavailable', { status: 404 });
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Network first for API requests
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Queue POST/PUT requests for background sync
    if (request.method === 'POST' || request.method === 'PUT') {
      await queueBackgroundSync(request);
      return new Response(JSON.stringify({ 
        queued: true, 
        message: 'Request queued for background sync' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('API unavailable', { status: 503 });
  }
}

// Handle map tile requests
async function handleMapTileRequest(request) {
  try {
    // Cache first for map tiles (they rarely change)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch and cache with longer expiry
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return placeholder tile or cached version
    const cachedResponse = await caches.match(request);
    return cachedResponse || createPlaceholderTile();
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Resource unavailable', { status: 404 });
  }
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  } else if (event.tag === 'api-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'GPS Life Tracker notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'notification-' + Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View App',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GPS Life Tracker', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_LOCATION':
        cacheLocationData(event.data.data);
        break;
        
      case 'QUEUE_SYNC':
        queueBackgroundSync(event.data.request);
        break;
        
      case 'GET_CACHE_SIZE':
        getCacheSize().then(size => {
          event.ports[0].postMessage({ size });
        });
        break;
        
      case 'CLEAR_CACHE':
        clearCache().then(() => {
          event.ports[0].postMessage({ cleared: true });
        });
        break;
    }
  }
});

// Utility functions
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isMapTileRequest(request) {
  const url = new URL(request.url);
  return url.hostname.includes('tile.openstreetmap.org') ||
         url.hostname.includes('api.mapbox.com') ||
         url.pathname.includes('tiles');
}

async function queueBackgroundSync(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for background sync
    // This would integrate with the main app's data storage
    console.log('[SW] Queued request for background sync:', requestData);
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('api-sync');
    }
  } catch (error) {
    console.error('[SW] Failed to queue background sync:', error);
  }
}

async function syncQueuedRequests() {
  console.log('[SW] Syncing queued requests...');
  // Implementation would retrieve queued requests from IndexedDB
  // and attempt to send them to the server
}

async function syncLocationData() {
  console.log('[SW] Syncing location data...');
  // Implementation would sync pending location data with server
}

async function cacheLocationData(data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/cached-location-data', response);
  } catch (error) {
    console.error('[SW] Failed to cache location data:', error);
  }
}

async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('[SW] Failed to calculate cache size:', error);
    return 0;
  }
}

async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}

function createPlaceholderTile() {
  // Create a simple placeholder tile
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 256, 256);
  
  ctx.fillStyle = '#ccc';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Offline', 128, 128);
  
  return canvas.convertToBlob().then(blob => new Response(blob));
}

// Periodic cleanup of old cache entries
setInterval(async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Remove entries older than 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (responseDate < oneWeekAgo) {
            await cache.delete(key);
            console.log('[SW] Removed old cache entry:', key.url);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily

console.log('[SW] Service Worker loaded and ready');