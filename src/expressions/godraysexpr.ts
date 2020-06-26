import { ExprVec4, tag, n2e } from "./expr";
import { fcolor } from "./fragcolorexpr";
import { glslFuncs } from "../glslfunctions";
import { Float, Vec4, Vec2 } from "../exprtypes";
import { vec2 } from "./vecexprs";
export class GodRaysExpr extends ExprVec4 {
  constructor(
    col: Vec4,
    exposure: Float,
    decay: Float,
    density: Float,
    weight: Float,
    lightPos: Vec2
  ) {
    super(
      tag`godrays(${col}, ${exposure}, ${decay}, ${density}, ${weight}, ${lightPos})`,
      ["uCol", "uExposure", "uDecay", "uDensity", "uWeight", "uLightPos"]
    );
    this.externalFuncs = [glslFuncs.godrays];
    this.needs.extraBuffers = new Set([0]);
  }
}

export function godrays(
  col: Vec4 = fcolor(),
  exposure: Float | number = 1.0,
  decay: Float | number = 1.0,
  density: Float | number = 1.0,
  weight: Float | number = 0.01,
  lightPos: Vec2 = vec2(0.5, 0.5)
) {
  return new GodRaysExpr(
    col,
    n2e(exposure),
    n2e(decay),
    n2e(density),
    n2e(weight),
    lightPos
  );
}
