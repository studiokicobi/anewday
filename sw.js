// Show add to home screen prompt
// @ https://stackoverflow.com/questions/43646568/how-do-i-create-an-add-to-home-screen-instruction-page-for-ios-web-apps

// On page load
// (function () {
// Check if iOS
// if (!(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)) { return false; }

// Check if already in webapp
// if (window.navigator.standalone == true) { return false; }

// Check if you already asked them to add to homescreen
// if (document.cookie.search("alreadAsked") >= 0) { return false; }

// Ask user to add to homescreen
// document.getElementById("hiddenPrompt").style.display = 'inherit';
// });

// After clicking a button to dismiss prompt
// function hidePromptInFuture() {
// Do not show prompt again
// document.cookie = "alreadAsked=true; expires=Thu, 18 Dec 2099 12:00:00 UTC";
// }



self.addEventListener('install', event => {
  // console.info('[Service Worker] Installing Service Worker ...', event)
  return self.clients.claim();
})

self.addEventListener('activate', event => {
  // console.info('[Service Worker] Activating Service Worker ...', event)
  return self.clients.claim()
})

self.addEventListener('fetch', event => {
  // console.info('[Service Worker] Fetching something ...', event)
  event.respondWith(fetch(event.request))
})
