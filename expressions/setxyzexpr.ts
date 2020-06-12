// TODO replacing this with scomp gcomp
/*
import { Expr, tag } from "../effects/expression";
import { RawVec3, Vec3, Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { FragColorExpr } from "./fragcolorexpr";

export class SetXYZExpr extends Expr<Vec4> {
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
*/
