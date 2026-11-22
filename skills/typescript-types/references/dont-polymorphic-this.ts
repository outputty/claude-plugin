interface Finished {
  readonly finished: true;
}

export interface ThisBuilder {
  finish(): this & Finished;
}
