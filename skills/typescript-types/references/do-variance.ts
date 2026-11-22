interface Engine {
  readonly name: string;
}

interface Entry<In, Stored, Origin> {
  readonly input: In;
  readonly stored: Stored;
  readonly origin: Origin;
}
type Models = Record<string, Entry<unknown, unknown, unknown>>;

export interface VarianceStore<in out M extends Models, out E extends Engine> {
  readonly engine: E;
  add<N extends string, In>(name: N): VarianceStore<M & Record<N, Entry<In, In, "flow">>, E>;
}
