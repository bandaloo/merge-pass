import { Float, RawFloat, RawVec } from "../exprtypes";
import { Operator } from "../operator";
import { tag, VecExpr } from "./expr";

export class AddExpr<T extends VecExpr | Float> extends Operator<T> {
  constructor(left: T, right: T) {
    super(right, tag`(${left} + ${right})`, ["uLeft", "uRight"]);
  }

  setLeft(scalar: RawFloat) {
    this.setUniform("uLeft" + this.id, scalar);
  }

  setVector(scalar: RawVec) {
    this.setUniform("uRight" + this.id, scalar);
  }
}

export function add<T extends VecExpr | Float>(left: T, right: T) {
  return new AddExpr(left, right);
}
