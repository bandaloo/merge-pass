import { tag, ExprVec4 } from "./expr";

export class FragColorExpr extends ExprVec4 {
  constructor() {
    super(tag`(gl_FragColor)`, []);
  }
}

export function fcolor() {
  return new FragColorExpr();
}
