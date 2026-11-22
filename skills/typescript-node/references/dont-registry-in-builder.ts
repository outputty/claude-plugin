type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);

interface RegistryBuilder<Reg, Row> {
  from(input: Input<Row>): RegistryBuilder<Reg, Row>;
}
export interface RegistryStore<Reg> {
  add<N extends string, Row>(
    name: N,
    build: (b: RegistryBuilder<Reg, Row>) => unknown,
  ): RegistryStore<Reg & Record<N, Row>>;
}
