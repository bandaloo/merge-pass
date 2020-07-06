import { ExprVec2, tag } from "./expr";

export class NormFragCoordExpr extends ExprVec2 {
  constructor() {
    super(tag`(gl_FragCoord.xy / uResolution)`, []);
  }
}

/**
 * creates an expression that calculates the normalized frag coord (coordinates
 * range from 0.0 to 1.0)
 */
export function nfcoord() {
  return new NormFragCoordExpr();
}
