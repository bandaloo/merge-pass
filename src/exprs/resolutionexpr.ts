import { ExprVec2, tag } from "./expr";

/** resolution expression */
export class ResolutionExpr extends ExprVec2 {
  constructor() {
    super(tag`uResolution`, []);
  }
}

/** creates an expression that evaluates to a vec2 representing the resolution */
export function resolution() {
  return new ResolutionExpr();
}
