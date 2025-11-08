import './app.css';
import '@tailwindplus/elements';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
  props: {},
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Swallow registration errors to avoid leaking information in logs
    });
  });
}

export default app;
