import { ExprVec4, float, tag, n2e } from "./expr";
import { vec4 } from "./vecexprs";
import { Float, Vec4 } from "../exprtypes";
import { channel } from "./buffersampleexpr";

export class DepthToOcclusionExpr extends ExprVec4 {
  constructor(
    depthCol: Vec4 = channel(0),
    newCol: Vec4 = vec4(1, 1, 1, 1),
    threshold: Float = float(0.01)
  ) {
    super(tag`depth2occlusion(${depthCol}, ${newCol}, ${threshold})`, [
      "uDepth",
      "uNewCol",
      "uThreshold",
    ]);
  }
}

export function depth2occlusion(
  depthCol: Vec4,
  newCol: Vec4,
  threshold: Float | number
) {
  return new DepthToOcclusionExpr(depthCol, newCol, n2e(threshold));
}
