import { ExprFloat, tag } from "./expr";

export class TimeExpr extends ExprFloat {
  constructor() {
    super(tag`uTime`, []);
    this.needs.timeUniform = true;
  }
}

export function time() {
  return new TimeExpr();
}
