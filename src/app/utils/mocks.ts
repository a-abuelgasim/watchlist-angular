export class LocalStorageMock {
  static init() {
    Object.defineProperty(window, 'localStorage', { value: new LocalStorageMock() });
  }

  private store: {[key: string]: string} = {};

  constructor() {
    this.store = {};
  }

  // get length() {
  //   return Object.keys(this.store).length;
  // }

  // clear() {
  //   this.store = {};
  // }

  // key(num: number) {
  //   return '';
  // }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}
