// A fold reused as its combine typechecks and lies when the partial's type equals the item's type.
const count = (acc: number, _item: number) => acc + 1;
export const wrong = [3, 2].reduce(count, 0); // 2: the number of partials; the right answer is 5

const add = (left: number, right: number) => left + right;
export const right = [3, 2].reduce(add, 0); // 5
