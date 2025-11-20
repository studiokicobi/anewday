import './app.css';
import '@tailwindplus/elements';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
  props: {},
});

// Register service worker for PWA offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Detect if running in test environment (Playwright sets navigator.webdriver)
    const isTestEnvironment = navigator.webdriver;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates immediately
        registration.update();

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, skip waiting and reload
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(() => {
        // Swallow registration errors
      });

    // Reload page when new service worker takes control (skip in test environment)
    if (!isTestEnvironment) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  });
}

export default app;
