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
  const action = () => console.info(`Item ${item.description} was saved!`);
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
  .then(() => console.info("Service worker registered!"));

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
    window.location.reload(true);
  }, timeout);
}

refreshAt(0, 0, 0); // Refresh the page at midnight

// Toggle content

// Show an element
var show = function (elem) {
  elem.classList.add('is-visible');
};

// Hide an element
var hide = function (elem) {
  elem.classList.remove('is-visible');
};

// Toggle element visibility
var toggle = function (elem) {
  elem.classList.toggle('is-visible');
};

// Listen for click events
document.addEventListener('click', function (event) {

  // Make sure clicked element is our toggle
  if (!event.target.classList.contains('toggle')) return;

  // Prevent default link behavior
  event.preventDefault();

  // Get the content
  var content = document.querySelector(event.target.hash);
  if (!content) return;

  // Toggle the content
  toggle(content);

}, false);