export class ContextManager {
  private state: Record<string, any> = {};

  set(key: string, value: any) {
    this.state[key] = value;
  }

  get<T = any>(key: string): T {
    return this.state[key];
  }

  push(key: string, value: any) {
    if (!Array.isArray(this.state[key])) {
      this.state[key] = [];
    }
    this.state[key].push(value);
  }

  getRandom<T = any>(key: string): T | undefined {
    const list = this.state[key];
    if (!Array.isArray(list) || list.length === 0) return undefined;
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  getAll<T = any>(key: string): T[] {
    return Array.isArray(this.state[key]) ? this.state[key] : [];
  }
}
