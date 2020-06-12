import { Float, Vec, RawFloat } from "../exprtypes";
import { ExprVec2, tag, VecExpr, ExprVec4, ExprVec3 } from "./expr";
import { getVecSize } from "./vecexprs";

class ScaleExpr extends ExprVec4 {
  vec: Vec;

  constructor(scalar: Float, vec: Vec) {
    super(tag`(${scalar} * ${vec})`, ["uScalar", "uVec"]);
    this.vec = vec;
  }

  getSize() {
    return getVecSize(this.vec);
  }

  setScalar(scalar: RawFloat) {
    this.setUniform("uScalar" + this.id, scalar);
  }

  // TODO should there be a setVec?
}

export function scale<T extends VecExpr>(scalar: Float, vec: T) {
  const s = new ScaleExpr(scalar, vec);
  return s;
  /*
  switch (getVecSize(vec)) {
    case 2:
      return s as ExprVec2;
    case 3:
      return s as ExprVec3;
    case 4:
      return s;
    default:
      throw new Error("vector of incorrect size");
  }
  */
}
