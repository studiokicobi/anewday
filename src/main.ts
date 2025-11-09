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
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Swallow registration errors
    });
  });
}

export default app;
