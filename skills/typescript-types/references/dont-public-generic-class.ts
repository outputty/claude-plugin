export class ClassStore<Reg> {
  private readonly names = new Set<string>();
  add<N extends string, Row>(name: N): ClassStore<Reg & Record<N, Row>> {
    this.names.add(name);
    return this as unknown as ClassStore<Reg & Record<N, Row>>;
  }
  list(): string[] {
    return [...this.names];
  }
}
