import { Float, RawFloat } from "../exprtypes";
import { tag, VecExpr, Expr } from "./expr";
import { Operator } from "../operator";

export class ScaleExpr<T extends Expr> extends Operator<T> {
  vec: T;

  constructor(scalar: Float, vec: T) {
    super(vec, tag`(${scalar} * ${vec})`, ["uScalar", "uVec"]);
    this.vec = vec;
  }

  setScalar(scalar: RawFloat) {
    this.setUniform("uScalar" + this.id, scalar);
  }

  // TODO this should be part of an interface
  /*
  r() {
    return (this as unknown) as T;
  }
  */
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
