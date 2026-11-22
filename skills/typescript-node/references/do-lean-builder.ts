interface Engine {
  readonly name: string;
}
type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);

export interface LeanBuilder<Row, E extends Engine> {
  readonly engine: E;
  from(input: Input<Row>): LeanBuilder<Row, E>;
}
