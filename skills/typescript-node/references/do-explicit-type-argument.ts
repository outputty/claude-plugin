interface Order {
  readonly id: number;
  readonly total: number;
}
type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);

declare function rowsOf<T>(): Iterable<T>;
declare function fromRows<Row>(input: Input<Row>): void;
export function loadOrders(): void {
  fromRows(rowsOf<Order>());
}
