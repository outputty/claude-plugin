import { match } from "ts-pattern";

type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

export function area<S extends Shape>(shape: S): number {
  const concrete: Shape = shape;
  return match(concrete)
    .with({ kind: "circle" }, ({ radius }) => Math.PI * radius ** 2)
    .with({ kind: "square" }, ({ side }) => side ** 2)
    .exhaustive();
}
