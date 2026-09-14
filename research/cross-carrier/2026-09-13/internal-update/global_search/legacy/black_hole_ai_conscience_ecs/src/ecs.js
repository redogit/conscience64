
export class ECS {
  constructor() {
    this.entities = new Set();
    this.components = new Map();
    this.systems = [];
    this.resources = new Map();
    this.events = [];
  }
  create(id) { this.entities.add(id); return id; }
  add(id, type, value) {
    this.create(id);
    if (!this.components.has(type)) this.components.set(type, new Map());
    this.components.get(type).set(id, value);
    return value;
  }
  get(id, type) { return this.components.get(type)?.get(id); }
  has(id, ...types) { return types.every(t => this.components.get(t)?.has(id)); }
  query(...types) {
    if (!types.length) return [...this.entities];
    const first = this.components.get(types[0]);
    if (!first) return [];
    return [...first.keys()].filter(id => types.slice(1).every(t => this.components.get(t)?.has(id)));
  }
  setResource(name, value) { this.resources.set(name, value); return value; }
  resource(name, fallback) {
    if (!this.resources.has(name) && fallback !== undefined) this.resources.set(name, fallback);
    return this.resources.get(name);
  }
  emit(type, detail = {}) {
    this.events.push({ type, detail, at: globalThis.performance?.now?.() ?? Date.now() });
    if (this.events.length > 256) this.events.splice(0, this.events.length - 256);
  }
  addSystem(name, order, fn) {
    this.systems.push({ name, order, fn });
    this.systems.sort((a,b) => a.order - b.order);
  }
  update(dt, now) { for (const s of this.systems) s.fn(this, dt, now); }
}
export const coord4 = (x=0, y=0, z=0, t=0) => new Float64Array([x,y,z,t]);
export const vec3 = (x=0, y=0, z=0) => new Float64Array([x,y,z]);
