/*
import { tag, ExprVec } from "./expr";
import { Operator } from "../operator";
import { RawVec } from "../exprtypes";

export class DotExpr<T extends ExprVec> extends Operator<T> {
  left: T;
  right: T;

  constructor(left: T, right: T) {
    super(left, tag`(${left} * ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }

  setLeft(left: RawVec) {
    this.setUniform("uLeft" + this.id, left);
  }

  setRight(right: RawVec) {
    this.setUniform("uRight" + this.id, right);
  }
}

export function dot<T extends ExprVec>(left: T, right: T) {
  return new DotExpr(left, right);
}
*/
