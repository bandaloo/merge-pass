import { Expr, tag } from "../effects/expression";
import { RawVec3, Vec3, Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { FragColorExpr } from "./fragcolorexpr";

export class SetXYZExpr extends Expr<Vec4> {
  /**
   * @param components hue, sat and brightness components
   * @param mask which original color components to zero out and which to keep
   * (defaults to only zeroing out all of original color)
   */
  constructor(
    components: Vec3,
    mask: Vec3 = [0, 0, 0],
    col: Vec4 = new FragColorExpr()
  ) {
    super(tag`(setxyz(${components}, ${mask}, ${col}))`, [
      "uComponent",
      "uMask",
    ]);
    this.externalFuncs = [glslFuncs.setxyz];
  }

  setComponents(components: RawVec3) {
    this.setUniform("uComponent", components);
  }

  setMask(mask: RawVec3) {
    this.setUniform("uMask", mask);
  }
}
