interface Engine {
  readonly name: string;
}

interface Entry<In, Stored, Origin> {
  readonly input: In;
  readonly stored: Stored;
  readonly origin: Origin;
}
type Models = Record<string, Entry<unknown, unknown, unknown>>;
interface StoreShared {
  readonly namespace: string;
  list(): string[];
}
export interface Store<M extends Models, E extends Engine> extends StoreShared {
  readonly engine: E;
  add<N extends string, In, Stored, Origin>(name: N): Store<M & Record<N, Entry<In, Stored, Origin>>, E>;
}
class StoreImpl {
  private readonly names: string[] = [];
  constructor(readonly config: { readonly engine: Engine; readonly namespace: string }) {}
  get engine(): Engine {
    return this.config.engine;
  }
  get namespace(): string {
    return this.config.namespace;
  }
  add(name: string): this {
    this.names.push(name);
    return this;
  }
  list(): string[] {
    return [...this.names];
  }
}
export function createStore(config: { readonly engine: Engine; readonly namespace: string }): Store<{}, Engine> {
  return new StoreImpl(config) as unknown as Store<{}, Engine>;
}
