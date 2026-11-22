// One example per line of SKILL.md's "Types that check fast", each under its label.
// Typecheck: tsc --noEmit --strict --target es2022 --module esnext fast-types.ts

interface Engine {
  readonly name: string;
}
interface Order {
  readonly id: number;
  readonly total: number;
}
type Input<Row> = Iterable<Row> | (() => Promise<Row[]>);
interface Drained {
  readonly drained: true;
}

// ---------- Don't ----------

// dont-registry-in-builder
interface RegistryBuilder<Reg, Row> {
  from(input: Input<Row>): RegistryBuilder<Reg, Row>;
}
export interface RegistryStore<Reg> {
  add<N extends string, Row>(
    name: N,
    build: (b: RegistryBuilder<Reg, Row>) => unknown,
  ): RegistryStore<Reg & Record<N, Row>>;
}

// dont-callback-returns-builder
interface FullBuilder<Row, F> {
  from<G extends Input<Row>>(input: G): FullBuilder<Row, G>;
  named(name: string): FullBuilder<Row, F>;
  validate(): FullBuilder<Row, F>;
}
export declare function addFull<Row, F>(build: (b: FullBuilder<Row, unknown>) => FullBuilder<Row, F>): F;

// dont-new-builder-per-fact
export interface MarkingBuilder<Row, Marks> {
  named<const N extends string>(name: N): MarkingBuilder<Row, Marks & { readonly named: N }>;
}

// dont-public-generic-class
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

// dont-literal-class-parameter
export class NamespacedStore<E extends Engine, const Ns extends string> {
  constructor(readonly config: { readonly engine: E; readonly namespace: Ns }) {}
}

// dont-polymorphic-this
export interface ThisBuilder {
  drain(): this & Drained;
}

// dont-anonymous-object-type
export interface InlinePartitioner<E extends Engine> {
  partition<V>(values: readonly V[], build: (ctx: { readonly value: V; readonly engine: E }) => void): void;
}

// dont-compare-all-entries
type Clash<Reg, N extends string> = {
  [K in keyof Reg]: Lowercase<K & string> extends Lowercase<N> ? K : never;
}[keyof Reg];
export interface ComparingStore<Reg> {
  add<N extends string>(name: [Clash<Reg, N>] extends [never] ? N : never): ComparingStore<Reg & Record<N, true>>;
}

// dont-merged-registry-per-call (MergedMembers is filled by each engine module's `declare module`)
interface MergedMembers<Chain> {
  sql: { index(column: string): Chain };
}
type MembersOf<E, Chain> = E extends { readonly kind?: infer K extends keyof MergedMembers<Chain> }
  ? MergedMembers<Chain>[K]
  : {};
export interface MergedBuilder<E, Row> {
  from(input: Input<Row>): MergedBuilder<E, Row> & MembersOf<E, MergedBuilder<E, Row>>;
}

// ---------- Do ----------

// do-callback-returns-state
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

// do-lean-builder
export interface LeanBuilder<Row, E extends Engine> {
  readonly engine: E;
  from(input: Input<Row>): LeanBuilder<Row, E>;
}

// do-one-registry-map
interface Entry<In, Stored, Origin> {
  readonly input: In;
  readonly stored: Stored;
  readonly origin: Origin;
}
type Models = Record<string, Entry<unknown, unknown, unknown>>;
export interface MapStore<M extends Models, E extends Engine> {
  add<N extends string, In, Stored, Origin>(name: N): MapStore<M & Record<N, Entry<In, Stored, Origin>>, E>;
}
export type Shop = MapStore<{ orders: Entry<Order, Order & { readonly loadId: string }, "flow"> }, Engine>;

// do-interface-surface
interface StoreShared {
  readonly namespace: string;
  list(): string[];
}
export interface Store<M extends Models, E extends Engine> extends StoreShared {
  readonly engine: E;
  add<N extends string, In, Stored, Origin>(name: N): Store<M & Record<N, Entry<In, Stored, Origin>>, E>;
}
class StoreImpl {
  private readonly names: string[] = [];
  constructor(readonly config: { readonly engine: Engine; readonly namespace: string }) {}
  get engine(): Engine {
    return this.config.engine;
  }
  get namespace(): string {
    return this.config.namespace;
  }
  add(name: string): this {
    this.names.push(name);
    return this;
  }
  list(): string[] {
    return [...this.names];
  }
}

// do-literal-on-construct-signature
interface StoreConstructor {
  new <E extends Engine, const Ns extends string = string>(config: {
    readonly engine: E;
    readonly namespace: CheckedName<E, Ns>;
  }): Store<{}, E>;
}
export const Store = StoreImpl as unknown as StoreConstructor;

// do-check-where-written
type CheckedName<E, N extends string> = string extends N
  ? N
  : E extends { readonly lowercaseNames: true }
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

// do-this-parameter
export interface ParamBuilder {
  drain<Self>(this: Self): Self & Drained;
}

// do-variance
export interface VarianceStore<in out M extends Models, out E extends Engine> {
  readonly engine: E;
  add<N extends string, In>(name: N): VarianceStore<M & Record<N, Entry<In, In, "flow">>, E>;
}

// do-named-object-type
interface PartitionContext<V, E> {
  readonly value: V;
  readonly engine: E;
}
export interface NamedPartitioner<E extends Engine> {
  partition<V>(values: readonly V[], build: (ctx: PartitionContext<V, E>) => void): void;
}

// do-real-member
class DuckEngine implements Engine {
  readonly name = "duck";
  readonly lowercaseNames = true as const;
}
type LowercasesNames<E> = E extends { readonly lowercaseNames: true } ? true : false;
export type DuckLowercases = LowercasesNames<DuckEngine>;

// do-explicit-type-argument
declare function rowsOf<T>(): Iterable<T>;
declare function fromRows<Row>(input: Input<Row>): void;
export function loadOrders(): void {
  fromRows(rowsOf<Order>());
}

// do-runtime-twin
export function assertLowercaseName(name: string): void {
  const lower = name.toLowerCase();
  if (name !== lower) throw new Error(`names are lowercase: write '${lower}'`);
}

// do-measure-one-checker
//   tsc --noEmit -p tsconfig.json --extendedDiagnostics --checkers 1
