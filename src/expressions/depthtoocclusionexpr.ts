import { ExprVec4, float, tag, n2e } from "./expr";
import { vec4 } from "./vecexprs";
import { Float, Vec4 } from "../exprtypes";
import { channel } from "./buffersampleexpr";

// TODO reconsider whether we need this
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

  // TODO implement setters if this ends up being a useful expression
}

/**
 * converts a `1 / distance` depth buffer to an occlusion buffer
 * @param depthCol values below this are not occluded (set to something low,
 * like 0.1)
 * @param newCol the color to replace unoccluded areas by (defaults to white)
 * @param threshold values below this are not occluded (set to something low,
 * like 0.1 or lower)
 */
export function depth2occlusion(
  depthCol: Vec4,
  newCol: Vec4,
  threshold: Float | number
) {
  return new DepthToOcclusionExpr(depthCol, newCol, n2e(threshold));
}
