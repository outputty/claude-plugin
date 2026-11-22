interface Engine {
  readonly name: string;
}

class DuckEngine implements Engine {
  readonly name = "duck";
  readonly foldsCase = true as const;
}
interface Entry<In, Stored, Origin> {
  readonly input: In;
  readonly stored: Stored;
  readonly origin: Origin;
}
type Models = Record<string, Entry<unknown, unknown, unknown>>;
type CheckedName<E, N extends string> = string extends N
  ? N
  : E extends { readonly foldsCase: true }
    ? N extends Lowercase<N>
      ? N
      : `names are lowercase: write '${Lowercase<N>}'`
    : N;
interface NamingBuilder<E> {
  named<const N extends string>(name: CheckedName<E, N>): void;
}
interface StoreShared {
  readonly namespace: string;
  list(): string[];
}
export interface Store<M extends Models, E extends Engine> extends StoreShared {
  readonly engine: E;
  add<N extends string, In, Stored, Origin>(name: N): Store<M & Record<N, Entry<In, Stored, Origin>>, E>;
}
class StoreImpl {
  constructor(readonly config: { readonly engine: Engine; readonly namespace: string }) {}
  get engine(): Engine {
    return this.config.engine;
  }
  get namespace(): string {
    return this.config.namespace;
  }
  add(): this {
    return this;
  }
  list(): string[] {
    return [];
  }
}
interface StoreConstructor {
  new <E extends Engine, const Ns extends string = string>(config: {
    readonly engine: E;
    readonly namespace: CheckedName<E, Ns>;
  }): Store<{}, E>;
}
export const Store = StoreImpl as unknown as StoreConstructor;
