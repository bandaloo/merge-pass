import { ExprVec4, tag } from "./expr";
import { fcolor } from "./fragcolorexpr";
import { glslFuncs } from "../glslfunctions";
export class GodRaysExpr extends ExprVec4 {
  // TODO paremeters
  constructor() {
    super(tag`godrays(${fcolor()}, 1.0, 1.0, 1.0, 0.01, vec2(0.5, 0.5))`, [
      "uCol",
    ]);
    this.externalFuncs = [glslFuncs.godrays];
    this.needs.extraBuffers = new Set([0]);
  }
}

export function godrays() {
  return new GodRaysExpr();
}
