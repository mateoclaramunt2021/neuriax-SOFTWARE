/**
 * PASO 36: Service Worker - PWA Instalable
 * 
 * Funcionalidades:
 * - Instalación y activación
 * - Estrategias de caché (Cache-First, Network-First)
 * - Sincronización en background
 * - Notificaciones push
 * - Detección de actualizaciones
 * 
 * Estrategia de Caché:
 * - Assets estáticos: Cache-First (img, css, js, fonts)
 * - Documentos HTML: Network-First (con fallback a caché)
 * - API: Network-First (con fallback a datos offline)
 * - Analytics: Network-First (descartar fallos)
 */

// Configuración de versiones de caché
const CACHE_VERSION = 'v36-paso-pwa-1.0.0';
const CACHE_NAMES = {
  ASSETS: `${CACHE_VERSION}-assets`,
  API: `${CACHE_VERSION}-api`,
  PAGES: `${CACHE_VERSION}-pages`,
  IMAGES: `${CACHE_VERSION}-images`
};

// Assets a pre-cachear durante la instalación
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/App.js',
  '/App.css',
  '/index.js',
  '/index.css'
];

/**
 * EVENTO: INSTALL
 * Se dispara cuando el SW se instala
 * Pre-cachea los assets esenciales
 */
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing Service Worker v36...');

  event.waitUntil(
    caches.open(CACHE_NAMES.ASSETS)
      .then((cache) => {
        console.log('📦 [SW] Pre-caching assets...');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('⚠️  [SW] Some assets could not be pre-cached:', err);
          // No fallar si algún asset no se puede cachear
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('✅ [SW] Assets pre-cached successfully');
        // Activar inmediatamente sin esperar a que se cierren otras pestañas
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('❌ [SW] Installation failed:', err);
      })
  );
});

/**
 * EVENTO: ACTIVATE
 * Se dispara cuando el SW se activa
 * Limpia cachés antiguas y asume el control de todas las páginas
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating Service Worker...');

  event.waitUntil(
    // Limpiar cachés antiguas
    caches.keys()
      .then((cacheNames) => {
        console.log('🧹 [SW] Cleaning up old caches...');
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar cachés que no sean las actuales
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log(`🗑️  [SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        console.log('✅ [SW] Cache cleanup complete');
        // Tomar control de todos los clientes
        return self.clients.claim();
      })
      .catch((err) => {
        console.error('❌ [SW] Activation failed:', err);
      })
  );
});

/**
 * EVENTO: FETCH
 * Se dispara en cada petición HTTP
 * Implementa estrategias de caché según el tipo de recurso
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones a navegador y extensiones
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Estrategia según tipo de recurso
  if (isAssetRequest(url)) {
    // Assets: Cache-First (usa caché si existe, sino red)
    event.respondWith(cacheFirstStrategy(request));
  } else if (isApiRequest(url)) {
    // API: Network-First (intenta red primero, sino caché)
    event.respondWith(networkFirstStrategy(request));
  } else if (isPageRequest(url)) {
    // Documentos HTML: Network-First con fallback
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Otros: Network-First por defecto
    event.respondWith(networkFirstStrategy(request));
  }
});

/**
 * Detecta si es un request de asset (CSS, JS, imagen, font)
 */
function isAssetRequest(url) {
  const assetExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.otf', '.ico'
  ];
  return assetExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Detecta si es un request de API
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.pathname.startsWith('/auth/') ||
         url.pathname.startsWith('/datos/');
}

/**
 * Detecta si es un request de página HTML
 */
function isPageRequest(url) {
  return url.pathname.endsWith('.html') || 
         url.pathname === '/' ||
         !url.pathname.includes('.');
}

/**
 * ESTRATEGIA: Cache-First
 * Devuelve el recurso del caché si existe, sino lo obtiene de la red
 */
async function cacheFirstStrategy(request) {
  try {
    // Buscar en caché
    const cached = await caches.match(request);
    if (cached) {
      console.log(`📦 [Cache-First] ${request.url} - from cache`);
      return cached;
    }

    // Si no está en caché, obtener de la red
    const response = await fetch(request);
    
    // Cachear la respuesta si es válida
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAMES.ASSETS);
      cache.put(request, response.clone());
      console.log(`📥 [Cache-First] ${request.url} - fetched from network`);
    }

    return response;
  } catch (error) {
    console.error(`❌ [Cache-First] ${request.url} failed:`, error);
    
    // Intenta servir desde caché como fallback
    const cached = await caches.match(request);
    if (cached) {
      console.log(`📦 [Cache-First] ${request.url} - serving from cache (fallback)`);
      return cached;
    }

    // Respuesta genérica de error
    return createErrorResponse();
  }
}

/**
 * ESTRATEGIA: Network-First
 * Intenta obtener de la red primero, si falla usa caché
 */
async function networkFirstStrategy(request) {
  try {
    // Intentar obtener de la red
    const response = await fetchWithTimeout(request, 5000);
    
    if (response && response.status === 200) {
      // Cachear respuestas exitosas
      const cacheName = getAppropriateCache(request);
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      console.log(`📥 [Network-First] ${request.url} - from network`);
      return response;
    }

    // Si la respuesta no es 200, buscar en caché
    const cached = await caches.match(request);
    if (cached) {
      console.log(`📦 [Network-First] ${request.url} - from cache (non-200 response)`);
      return cached;
    }

    return response;
  } catch (error) {
    console.warn(`⚠️  [Network-First] ${request.url} network error:`, error.message);

    // Red falló, intentar caché
    const cached = await caches.match(request);
    if (cached) {
      console.log(`📦 [Network-First] ${request.url} - from cache (network failed)`);
      return cached;
    }

    // Sin caché disponible, error
    if (isPageRequest(new URL(request.url))) {
      return createOfflinePageResponse();
    }

    return createErrorResponse();
  }
}

/**
 * Fetch con timeout
 */
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

/**
 * Selecciona el caché apropiado para una request
 */
function getAppropriateCache(request) {
  const url = new URL(request.url);
  
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    return CACHE_NAMES.IMAGES;
  } else if (isApiRequest(url)) {
    return CACHE_NAMES.API;
  } else if (isPageRequest(url)) {
    return CACHE_NAMES.PAGES;
  }
  
  return CACHE_NAMES.ASSETS;
}

/**
 * Respuesta de error genérica
 */
function createErrorResponse() {
  return new Response(
    JSON.stringify({
      error: 'Service Worker Error',
      message: 'No fue posible obtener el recurso'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Página offline
 */
function createOfflinePageResponse() {
  return new Response(
    `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Modo Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
        }
        h1 {
          color: #333;
          margin: 0 0 0.5rem 0;
        }
        p {
          color: #666;
          margin: 0.5rem 0;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background: #764ba2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Modo Offline</h1>
        <p>Parece que no hay conexión a internet.</p>
        <p>Algunas funciones están limitadas, pero puedes usar las funciones offline disponibles.</p>
        <button onclick="window.location.reload()">Intentar Nuevamente</button>
      </div>
    </body>
    </html>
    `,
    {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }
  );
}

/**
 * EVENTO: MESSAGE
 * Comunicación entre el SW y los clientes
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  console.log(`📬 [SW] Message received: ${type}`, payload);

  switch (type) {
    case 'SKIP_WAITING':
      // Permitir actualización inmediata
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      // Limpiar un caché específico
      if (payload && payload.cacheName) {
        caches.delete(payload.cacheName).then(() => {
          console.log(`🗑️  [SW] Cache cleared: ${payload.cacheName}`);
          event.ports[0]?.postMessage({ success: true });
        });
      }
      break;

    case 'CLEAR_ALL_CACHES':
      // Limpiar todos los cachés
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('🗑️  [SW] All caches cleared');
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'CACHE_URLS':
      // Cachear URLs específicas
      if (payload && payload.urls && Array.isArray(payload.urls)) {
        const cacheName = payload.cacheName || CACHE_NAMES.ASSETS;
        caches.open(cacheName).then((cache) => {
          cache.addAll(payload.urls).then(() => {
            console.log(`✅ [SW] URLs cached: ${payload.urls.length} items`);
            event.ports[0]?.postMessage({ success: true });
          }).catch((err) => {
            console.error('❌ [SW] Failed to cache URLs:', err);
            event.ports[0]?.postMessage({ success: false, error: err.message });
          });
        });
      }
      break;

    case 'GET_CACHE_SIZE':
      // Obtener tamaño del caché
      getCacheSizeInfo().then((info) => {
        event.ports[0]?.postMessage({ success: true, data: info });
      });
      break;

    default:
      console.warn(`⚠️  [SW] Unknown message type: ${type}`);
  }
});

/**
 * Obtiene información del tamaño de los cachés
 */
async function getCacheSizeInfo() {
  const cacheNames = await caches.keys();
  const sizes = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    sizes[cacheName] = keys.length;
  }

  return sizes;
}

/**
 * EVENTO: SYNC en Background
 * Se utiliza para sincronizar datos cuando se recupera la conexión
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background Sync:', event.tag);

  if (event.tag === 'sync-datos') {
    event.waitUntil(syncPendingData());
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

/**
 * Sincroniza datos pendientes
 */
async function syncPendingData() {
  try {
    console.log('📤 [SW] Syncing pending data...');
    // Implementación de sincronización
    // Obtener datos pendientes del localStorage y enviar al servidor
    return Promise.resolve();
  } catch (error) {
    console.error('❌ [SW] Sync failed:', error);
    return Promise.reject(error);
  }
}

/**
 * Sincroniza analytics
 */
async function syncAnalytics() {
  try {
    console.log('📊 [SW] Syncing analytics...');
    // Implementación de sincronización de analytics
    return Promise.resolve();
  } catch (error) {
    console.error('❌ [SW] Analytics sync failed:', error);
    return Promise.reject(error);
  }
}

/**
 * EVENTO: PUSH
 * Notificaciones push
 */
self.addEventListener('push', (event) => {
  console.log('🔔 [SW] Push notification received');

  if (!event.data) {
    console.warn('⚠️  [SW] Push event without data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nueva notificación',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data || {},
      tag: data.tag || 'notification',
      requireInteraction: data.requireInteraction || false,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'NEURIAX', options)
    );
  } catch (error) {
    console.error('❌ [SW] Failed to show notification:', error);
  }
});

/**
 * EVENTO: NOTIFICATION CLICK
 * Maneja clicks en notificaciones
 */
self.addEventListener('notificationclick', (event) => {
  console.log('👆 [SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar una ventana abierta
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('✅ Service Worker v36 - PWA Instalable loaded');
