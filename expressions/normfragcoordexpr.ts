import { ExprVec2, tag } from "./expr";

export class NormFragCoordExpr extends ExprVec2 {
  constructor() {
    super(tag`(gl_FragCoord.xy / uResolution)`, []);
    this.needs.centerSample = false;
  }
}

export function nfcoord() {
  return new NormFragCoordExpr();
}
