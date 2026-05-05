// singleton class to manage the user's data

import { v4WithTimestamp } from './uuid.js';
import { DEFAULT_SETTINGS } from './game/settings.js';

let instance;
class DataStore extends EventTarget {
  #items = [];
  #settings = DEFAULT_SETTINGS;
  #itemsById = new Map();

  constructor() {
    if (instance) {
      throw new Error('New instance cannot be created!!');
    }
    super();

    instance = this;
  }

  #loadRecordsFromJson(json) {
    try {
      const records = JSON.parse(json);
      if (!Array.isArray(records)) {
        console.warn('[DataStore] Expected array JSON, falling back to empty list.');
        return [];
      }
      records.forEach((item, index) => {
        if (!item.id) {
          records[index].id = v4WithTimestamp();
        }
      });
      return records;
    } catch (error) {
      console.warn('[DataStore] Failed to parse stored JSON, resetting items.', error);
      try {
        window.localStorage.setItem('items', '[]');
      } catch (storageError) {
        console.warn('[DataStore] Failed to reset stored items.', storageError);
      }
      return [];
    }
  }

  #loadSettingsFromJson(json) {
    try {
      const settings = JSON.parse(json);
      return settings;
    } catch (error) {
      console.warn('[DataStore] Failed to parse stored JSON, resetting settings.', error);
      return DEFAULT_SETTINGS;
    }
  }

  async init() {
    let savedItemsJson = window.localStorage.getItem('items');
    if (!savedItemsJson) {
      savedItemsJson = '[]';
      window.localStorage.setItem('items', savedItemsJson);
    }
    this.#items = this.#loadRecordsFromJson(savedItemsJson);
    this.#reindex();

    let savedSettingsJson = window.localStorage.getItem('settings');
    if (!savedSettingsJson) {
      savedSettingsJson = JSON.stringify(DEFAULT_SETTINGS);
      window.localStorage.setItem('settings', savedSettingsJson);
    }
    this.#settings = this.#loadSettingsFromJson(savedSettingsJson);

    setTimeout(() => {
      this.#emitChangeEvent('init', ['*']);
    }, 0);
  }

  import(jsonData) {
    const newItems = this.#loadRecordsFromJson(jsonData);
    Array.prototype.unshift.apply(this.#items, newItems);
    this.#reindex();

    setTimeout(() => {
      this.#emitChangeEvent('init', ['*']);
    }, 0);
  }

  #saveItems() {
    window.localStorage.setItem('items', JSON.stringify(this.#items));
  }

  #emitChangeEvent(changeType, affectedRecords) {
    const changeEvent = new CustomEvent('change', {
      detail: {
        items: this.#items,
        changeType,
        affectedRecords,
      },
    });
    this.dispatchEvent(changeEvent);
  }

  #reindex() {
    this.#itemsById = new Map();
    this.#items.forEach(item => {
      this.#itemsById.set(item.id, item);
    });
    this.#saveItems();
  }

  get items() {
    return this.#items;
  }

  getItemById(id) {
    return this.#itemsById.get(id);
  }

  addItem(record) {
    record.id = v4WithTimestamp();
    this.#items.unshift(record);
    this.#reindex();
    this.#emitChangeEvent('add', record);
  }

  updateItem(record) {
    const index = this.#items.findIndex(rec => rec.id === record.id);
    if (index > -1) {
      this.#items[index] = record;
      this.#reindex();
      this.#emitChangeEvent('update', record);
    }
  }

  /**
   * Insert or replace a row by explicit id (used for singleton slots like active game).
   * @param {string} id
   * @param {object} record fields merged with `id`
   */
  upsertItemById(id, record) {
    const merged = { ...record, id };
    const index = this.#items.findIndex(rec => rec.id === id);
    if (index > -1) {
      this.#items[index] = merged;
      this.#reindex();
      this.#emitChangeEvent('update', merged);
    } else {
      this.#items.unshift(merged);
      this.#reindex();
      this.#emitChangeEvent('add', merged);
    }
  }

  deleteItem(id) {
    if (this.#itemsById.has(id)) {
      this.#items = this.#items.filter(r => r.id !== id);
      this.#reindex();
      this.#emitChangeEvent('delete', [id]);
    }
  }

  get settings() {
    return this.#settings;
  }

  updateSettings(settings) {
    this.#settings = settings;
    this.#saveSettings();
    this.#emitChangeEvent('updated-settings', settings);
  }

  #saveSettings() {
    window.localStorage.setItem('settings', JSON.stringify(this.#settings));
  }
}

const singleton = Object.freeze(new DataStore());

export default singleton;
