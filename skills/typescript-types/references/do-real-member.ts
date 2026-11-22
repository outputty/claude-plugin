interface Engine {
  readonly name: string;
}

class DuckEngine implements Engine {
  readonly name = "duck";
  readonly foldsCase = true as const;
}
type FoldsCase<E> = E extends { readonly foldsCase: true } ? true : false;
export type DuckFoldsCase = FoldsCase<DuckEngine>;
