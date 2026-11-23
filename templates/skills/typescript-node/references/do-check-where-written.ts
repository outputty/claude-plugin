interface Engine {
  readonly name: string;
}

class DuckEngine implements Engine {
  readonly name = "duck";
  readonly foldsCase = true as const;
}
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
declare const duckNaming: NamingBuilder<DuckEngine>;
export function nameOrders(): void {
  duckNaming.named("orders");
  // @ts-expect-error names are lowercase: write 'orders'
  duckNaming.named("Orders");
}
