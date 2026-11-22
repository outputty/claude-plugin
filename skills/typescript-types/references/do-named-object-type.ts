interface Engine {
  readonly name: string;
}

interface PartitionContext<V, E> {
  readonly value: V;
  readonly engine: E;
}
export interface NamedPartitioner<E extends Engine> {
  partition<V>(values: readonly V[], build: (ctx: PartitionContext<V, E>) => void): void;
}
