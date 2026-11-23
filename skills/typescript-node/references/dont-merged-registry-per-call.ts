type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);

interface MergedMembers<Chain> {
  sql: { index(column: string): Chain };
}
type MembersOf<E, Chain> = E extends { readonly kind?: infer K extends keyof MergedMembers<Chain> }
  ? MergedMembers<Chain>[K]
  : {};
export interface MergedBuilder<E, Row> {
  from(input: Input<Row>): MergedBuilder<E, Row> & MembersOf<E, MergedBuilder<E, Row>>;
}
