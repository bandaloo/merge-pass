import { ExprVec2, tag } from "./expr";

/** normalized mouse position expression */
export class NormMouseExpr extends ExprVec2 {
  constructor() {
    super(tag`(uMouse / uResolution.xy)`, []);
    this.needs.mouseUniform = true;
  }
}

/**
 * creates an expression that calculates the normalized mouse position
 * (coordinates range from 0 to 1)
 */
export function nmouse() {
  return new NormMouseExpr();
}
