type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);

interface BuilderState<F> {
  readonly from: F;
}
interface BuildResult<F> {
  readonly __state?: BuilderState<F>;
}
interface StateBuilder<Row> {
  from<G extends Input<Row>>(input: G): StateSource<Row, G>;
}
interface StateSource<Row, F> extends BuildResult<F> {
  named(name: string): StateSource<Row, F>;
}
export declare function addState<Row, F>(build: (b: StateBuilder<Row>) => BuildResult<F>): F;
