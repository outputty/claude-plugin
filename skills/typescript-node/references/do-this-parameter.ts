interface Finished {
  readonly finished: true;
}

export interface ParamBuilder {
  finish<Self>(this: Self): Self & Finished;
}
