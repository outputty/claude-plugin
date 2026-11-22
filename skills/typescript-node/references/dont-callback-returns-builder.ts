type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);

interface FullBuilder<Row, F> {
  from<G extends Input<Row>>(input: G): FullBuilder<Row, G>;
  named(name: string): FullBuilder<Row, F>;
  validate(): FullBuilder<Row, F>;
}
export declare function addFull<Row, F>(build: (b: FullBuilder<Row, unknown>) => FullBuilder<Row, F>): F;
