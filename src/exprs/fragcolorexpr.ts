import { tag, ExprVec4 } from "./expr";

/** fragment color expression */
export class FragColorExpr extends ExprVec4 {
  constructor() {
    super(tag`gl_FragColor`, []);
    this.needs.centerSample = true;
  }
}

/** creates an expression that evaluates to the fragment color */
export function fcolor() {
  return new FragColorExpr();
}
