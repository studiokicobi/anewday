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

// Page refresh at midnight function
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
  setTimeout(function() {
    window.location.reload(true);
  }, timeout);
}
refreshAt(0, 0, 0); // Refresh the page at midnight when the form resets
