import { tag, VecExpr } from "./expr";
import { Operator } from "../operator";

export class DotExpr<T extends VecExpr> extends Operator<T> {
  left: T;
  right: T;

  constructor(left: T, right: T) {
    super(left, tag`(${left} * ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }
}

export function dot<T extends VecExpr>(left: T, right: T) {
  return new DotExpr(left, right);
}
