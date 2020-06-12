import { Float } from "../exprtypes";
import { ExprFloat, tag } from "./expr";

export class MulExpr extends ExprFloat {
  left: Float;
  right: Float;

  constructor(left: Float, right: Float) {
    super(tag`(${left} * ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }
}
