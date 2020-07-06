import { ExprVec2, tag } from "./expr";

export class FragCoordExpr extends ExprVec2 {
  constructor() {
    super(tag`gl_FragCoord.xy`, []);
  }
}

/**
 * creates an expression that calculates the frag coord in pixels (samplers
 * take normalized coordinates, so you might want [[nfcoord]] instead)
 */
export function fcoord() {
  return new FragCoordExpr();
}
