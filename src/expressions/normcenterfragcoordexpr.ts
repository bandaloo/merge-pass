import { ExprVec2, tag } from "./expr";

export class NormCenterFragCoordExpr extends ExprVec2 {
  constructor() {
    super(tag`(gl_FragCoord.xy / uResolution - 0.5)`, []);
  }
}

export function ncfcoord() {
  return new NormCenterFragCoordExpr();
}
