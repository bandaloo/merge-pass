import { Float, Vec } from "../exprtypes";
import { n2p, PrimitiveVec, tag, n2e, Operator } from "./expr";

/** scalar multiplication of vector */
export class ScaleExpr<T extends Vec> extends Operator<T> {
  constructor(scalar: Float, vec: T) {
    super(vec, tag`(${scalar} * ${vec})`, ["uScalar", "uVec"]);
  }

  setScalar(scalar: number) {
    this.setUniform("uScalar" + this.id, n2p(scalar));
  }

  setVector(scalar: PrimitiveVec) {
    this.setUniform("uVec" + this.id, scalar);
  }
}

export function scale<T extends Vec>(scalar: number, vec: T) {
  return new ScaleExpr(n2e(scalar), vec);
}
