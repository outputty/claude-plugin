export interface MarkingBuilder<Row, Marks> {
  named<const N extends string>(name: N): MarkingBuilder<Row, Marks & { readonly named: N }>;
}
