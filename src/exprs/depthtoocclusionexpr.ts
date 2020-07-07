import { Float, Vec4 } from "../exprtypes";
import { channel } from "./channelsampleexpr";
import { ExprVec4, mut, n2e, pfloat, tag } from "./expr";
import { pvec4 } from "./vecexprs";

// TODO reconsider whether we need this
export class DepthToOcclusionExpr extends ExprVec4 {
  depthCol: Vec4;
  newCol: Vec4;
  threshold: Float;

  constructor(
    depthCol: Vec4 = channel(0),
    newCol: Vec4 = mut(pvec4(1, 1, 1, 1)),
    threshold: Float = mut(pfloat(0.01))
  ) {
    super(tag`depth2occlusion(${depthCol}, ${newCol}, ${threshold})`, [
      "uDepth",
      "uNewCol",
      "uThreshold",
    ]);
    this.depthCol = depthCol;
    this.newCol = newCol;
    this.threshold = threshold;
  }

  setDepthColor(depthCol: Vec4) {
    this.setUniform("uDepth" + this.id, depthCol);
    this.depthCol = depthCol;
  }

  setNewColor(newCol: Vec4) {
    this.setUniform("uNewCol" + this.id, newCol);
    this.newCol = newCol;
  }

  setThreshold(threshold: Float) {
    this.setUniform("uThreshold" + this.id, threshold);
    this.threshold = threshold;
  }
}

/**
 * converts a `1 / distance` depth texture to an occlusion texture, with all
 * occluded geometry being rendered as black
 * @param depthCol the color representing the inverse depth (defaults to
 * sampling from channel 0)
 * @param newCol the color to replace unoccluded areas by (defaults to white
 * and is mutable by default)
 * @param threshold values below this are not occluded (set to something low,
 * like 0.1 or lower; defaults to 0.01 and is mutable by default)
 */
export function depth2occlusion(
  depthCol: Vec4,
  newCol: Vec4,
  threshold: Float | number
) {
  return new DepthToOcclusionExpr(depthCol, newCol, n2e(threshold));
}
