import { ExprVec2, tag } from "./expr"

export class FragCoordExpr extends ExprVec2 {
  constructor() {
    super(tag`gl_FragCoord.xy`, []);
  }
}

export function fcoord() {
  return new FragCoordExpr();
}