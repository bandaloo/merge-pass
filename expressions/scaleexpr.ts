import { Expr, parse } from "../effects/expression";
import { Float, Vec } from "../effect";

export class ScaleExpr extends Expr<Float> {
  scalar: Float;
  vec: Vec;

  constructor(scalar: Float, vec: Vec) {
    super();
    this.scalar = scalar;
    this.vec = vec;
  }

  parse(): string {
    return `(${parse(this.scalar, "uScalarScale", this)} * ${parse(
      this.vec,
      "uVecScale",
      this
    )})`;
  }
}
