const form = document.querySelector("form");
const ul = document.querySelector("ul");
const className = "done";

let itemClickEmitter = () => {};
let buttonClickEmitter = () => {};

export default class HtmlService {
  static createItem(li) {
    const span = li.firstChild;
    return {
      id: +li.getAttribute("data-item-id"),
      done: li.classList.contains(className),
      description: span.textContent
    };
  }

  static toggleDone(event) {
    const li = event.currentTarget;
    li.classList.toggle(className);
    itemClickEmitter(HtmlService.createItem(li));
  }

  static buttonHandler(event) {
    event.stopPropagation();

    const li = event.target.parentNode;
    const itemId = li.getAttribute("data-item-id");

    buttonClickEmitter(itemId);
  }

  static addToHtmlList(item) {
    console.log(ul.childElementCount);
    if (ul.childElementCount >= 9) {
      return;
    }
    const li = document.createElement("li");
    const span = document.createElement("span");
    const button = document.createElement("button");

    li.setAttribute("data-item-id", item.id);
    li.addEventListener("click", HtmlService.toggleDone);
    span.textContent = item.description;

    button.textContent = "x";
    button.addEventListener("click", HtmlService.buttonHandler);

    if (item.done) {
      li.classList.add("done");
    }

    li.appendChild(span);
    li.appendChild(button);
    ul.appendChild(li);

    if (ul.childElementCount >= 9) {
      
      form.className = "max"; 
      form.querySelector("input").setAttribute("disabled", true);
      form.querySelector("input").value = "This is enough to do for now";
    }
  }

  static removeFromHtmlList(itemId) {
    const li = document.querySelector(`[data-item-id='${itemId}']`);
    ul.removeChild(li);
    form.classList.remove("max");
    form.querySelector("input").removeAttribute("disabled");
    form.querySelector("input").value = "";
  }

  static cleanInput(input) {
    input.value = "";
    input.focus();
  }

  static getClickedItem() {
    // why I'm not using a promise here?
    // https://stackoverflow.com/questions/33449469/promise-is-only-firing-once
    return {
      then: callback => this.bindClickedItem(callback)
    };
  }

  static bindClickedItem(callback) {
    itemClickEmitter = callback;
  }

  static getClickedButton() {
    // why I'm not using a promise here?
    // https://stackoverflow.com/questions/33449469/promise-is-only-firing-once
    return {
      then: callback => this.bindClickedButton(callback)
    };
  }

  static bindClickedButton(callback) {
    buttonClickEmitter = callback;
  }

  static getInputedItem() {
    // why I'm not using a promise here?
    // https://stackoverflow.com/questions/33449469/promise-is-only-firing-once
    return {
      then: callback => this.bindSubmittingAction(callback)
    };
  }

  static bindSubmittingAction(callback) {
    const onSubmit = event => {
      event.preventDefault();
      const input = event.target.item;
      callback(input.value);
      this.cleanInput(input);
    };
    form.addEventListener("submit", onSubmit);
  }
}
