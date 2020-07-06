import { ExprFloat, tag } from "./expr";

export class TimeExpr extends ExprFloat {
  constructor() {
    super(tag`uTime`, []);
    this.needs.timeUniform = true;
  }
}

/** creates a time expression that evaluates to the current time */
export function time() {
  return new TimeExpr();
}
