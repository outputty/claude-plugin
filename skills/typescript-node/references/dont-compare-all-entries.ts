type Clash<Reg, N extends string> = {
  [K in keyof Reg]: Lowercase<K & string> extends Lowercase<N> ? K : never;
}[keyof Reg];
export interface ComparingStore<Reg> {
  add<N extends string>(name: [Clash<Reg, N>] extends [never] ? N : never): ComparingStore<Reg & Record<N, true>>;
}
