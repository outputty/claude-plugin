interface Engine {
  readonly name: string;
}

export interface InlinePartitioner<E extends Engine> {
  partition<V>(values: readonly V[], build: (ctx: { readonly value: V; readonly engine: E }) => void): void;
}
