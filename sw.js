// Detects if device is on iOS 
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test( userAgent );
}
// Detects if device is in standalone mode
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

// Checks if should display install popup notification:
if (isIos() && !isInStandaloneMode()) {
  this.setState({ showInstallMessage: true });
}

self.addEventListener('install', event => {
  console.info('[Service Worker] Installing Service Worker ...', event)
  return self.clients.claim();
})

self.addEventListener('activate', event => {
  console.info('[Service Worker] Activating Service Worker ...', event)
  return self.clients.claim()
})

self.addEventListener('fetch', event => {
  console.info('[Service Worker] Fetching something ...', event)
  event.respondWith(fetch(event.request))
})
