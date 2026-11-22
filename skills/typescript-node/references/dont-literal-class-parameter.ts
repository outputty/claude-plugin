interface Engine {
  readonly name: string;
}

export class NamespacedStore<E extends Engine, const Ns extends string> {
  constructor(readonly config: { readonly engine: E; readonly namespace: Ns }) {}
}
