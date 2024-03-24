import TodoService from "./TodoService.js";
import HtmlService from "./HtmlService.js";

TodoService.getList().then(items => items.forEach(HtmlService.addToHtmlList));

const saveItem = (item, action) => {
  TodoService.saveItem(item).then(action);
};

const saveNewItem = description => {
  const newItem = { done: false, description };
  const action = savedItem => HtmlService.addToHtmlList(savedItem);
  saveItem(newItem, action);
};

const updateItem = item => {
  item.date = new Date();
  const action = () => console.info(`Item ${item.description} was saved`);
  saveItem(item, action);
};

const deleteItem = itemId => {
  TodoService.deleteItem(itemId).then(HtmlService.removeFromHtmlList);
};

HtmlService.getInputedItem().then(saveNewItem);

HtmlService.getClickedItem().then(updateItem);

HtmlService.getClickedButton().then(deleteItem);

navigator.serviceWorker
  .register("sw.js")


// Add install prompt to iOS

// Detect if the device uses iOS 

// const isIos = () => {
//   const userAgent = window.navigator.userAgent.toLowerCase();
//   return /iphone|ipad|ipod/.test(userAgent);
// }

function iOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

// Detect if the PWA is in standalone mode
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

// If both of the conditions are true, display the install notification
if (iOS() && !isInStandaloneMode()) {

  window.addEventListener("load", function () {
    var tooltip = document.getElementById("install");
    tooltip.classList.toggle("visible");
  });
}

if (!iOS()) { console.log("not iOS"); }






// Refresh the page once per day at midnight
// @ https://stackoverflow.com/questions/1217929/how-to-automatically-reload-a-web-page-at-a-certain-time
function refreshAt(hours, minutes, seconds) {
  var now = new Date();
  var then = new Date();

  if (
    now.getHours() > hours ||
    (now.getHours() == hours && now.getMinutes() > minutes) ||
    (now.getHours() == hours &&
      now.getMinutes() == minutes &&
      now.getSeconds() >= seconds)
  ) {
    then.setDate(now.getDate() + 1);
  }
  then.setHours(hours);
  then.setMinutes(minutes);
  then.setSeconds(seconds);

  var timeout = then.getTime() - now.getTime();
  setTimeout(function () {
    window.location.reload();
  }, timeout);
}

refreshAt(0, 0, 0); // Refresh the page at midnight


// Sortable.js
import Sortable from '../node_modules/sortablejs/modular/sortable.core.esm.js';

Sortable.create(items, {
  delay: 300
});