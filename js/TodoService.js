let dbInstance;
const dbName = "todoStore";
const osName = "todos";
const version = 3;

export default class TodoService {
  static upgradeDB(db) {
    console.info("Creating database ...");
    if (!db.objectStoreNames.contains(osName)) {
      db.createObjectStore(osName, { keyPath: "id", autoIncrement: true });
    }
  }

  static openDB(resolve, reject) {
    const request = indexedDB.open(dbName, version);

    request.addEventListener("upgradeneeded", event =>
      this.upgradeDB(event.target.result)
    );

    request.addEventListener("success", event => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    });

    request.addEventListener("error", event => {
      reject(event);
    });
  }

  static getDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        resolve(dbInstance);
      } else {
        this.openDB(resolve, reject);
      }
    });
  }

  static getTodosStore(mode) {
    return new Promise(resolve => {
      this.getDB().then(db => {
        const store = db.transaction(osName, mode).objectStore(osName);
        resolve(store);
      });
    });
  }

  static saveItem(item) {
    const addSavedIdToItem = id => {
      item.id = id;
      return item;
    };

    return new Promise((resolve, reject) => {
      const addItemIntoStore = todosStore => {
        const request = todosStore.put(item);
        request.onsuccess = event =>
          resolve(addSavedIdToItem(event.target.result));
        request.onerror = event => reject(event.target.result);
      };

      this.getTodosStore("readwrite").then(addItemIntoStore);
    });
  }

  static deleteItem(itemId) {
    return new Promise((resolve, reject) => {
      const deleteItemFromStore = todosStore => {
        const request = todosStore.delete(+itemId);
        request.onsuccess = event => resolve(itemId);
        request.onerror = event => reject(event.target.result);
      };

      this.getTodosStore("readwrite").then(deleteItemFromStore);
    });
  }

  static getList() {
    const isToday = someDate => {
      const today = new Date();
      return (
        someDate.getDate() == today.getDate() &&
        someDate.getMonth() == today.getMonth() &&
        someDate.getFullYear() == today.getFullYear()
      );
    };

    return new Promise((resolve, reject) => {
      const items = [];
      const fetchItem = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.date && !isToday(cursor.value.date)) {
            cursor.value.done = false;
          }
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };

      const fetchAllItems = todosStore => {
        const request = todosStore.openCursor();
        request.onsuccess = fetchItem;
        request.onerror = event => reject(event.target.result);
      };

      this.getTodosStore("readonly").then(fetchAllItems);
    });
  }
}
