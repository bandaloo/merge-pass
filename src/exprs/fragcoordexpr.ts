import { ExprVec2, tag } from "./expr";

/** frag coord expression (xy components only) */
export class FragCoordExpr extends ExprVec2 {
  constructor() {
    super(tag`gl_FragCoord.xy`, []);
  }
}

/**
 * creates an expression that evaluates to the frag coord in pixels (samplers
 * take normalized coordinates, so you might want [[nfcoord]] instead)
 */
export function pixel() {
  return new FragCoordExpr();
}
