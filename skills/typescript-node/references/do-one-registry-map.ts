interface Engine {
  readonly name: string;
}
interface Order {
  readonly id: number;
  readonly total: number;
}

interface Entry<In, Stored, Origin> {
  readonly input: In;
  readonly stored: Stored;
  readonly origin: Origin;
}
type Models = Record<string, Entry<unknown, unknown, unknown>>;
export interface MapStore<M extends Models, E extends Engine> {
  add<N extends string, In, Stored, Origin>(name: N): MapStore<M & Record<N, Entry<In, Stored, Origin>>, E>;
}
export type Shop = MapStore<{ orders: Entry<Order, Order & { readonly loadId: string }, "flow"> }, Engine>;
