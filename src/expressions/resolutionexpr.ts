import { ExprVec2, tag } from "./expr";

export class ResolutionExpr extends ExprVec2 {
  constructor() {
    super(tag`uResolution`, []);
  }
}

export function resolution() {
  return new ResolutionExpr();
}