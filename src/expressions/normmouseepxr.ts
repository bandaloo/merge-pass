import { ExprVec2, tag } from "./expr";

export class NormMouseExpr extends ExprVec2 {
  constructor() {
    super(tag`(uMouse / uResolution.xy)`, []);
    this.needs.mouseUniform = true;
  }
}

/**
 * creates an expression that calculates the normalized mouse position
 */
export function nmouse() {
  return new NormMouseExpr();
}
