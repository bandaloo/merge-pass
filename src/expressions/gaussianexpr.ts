import { Float } from "../exprtypes";
import { ExprFloat, n2e, tag } from "./expr";
import { glslFuncs } from "../glslfunctions";

export class GaussianExpr extends ExprFloat {
  constructor(x: Float, a: Float, b: Float) {
    super(tag`gaussian(${x}, ${a}, ${b})`, ["uFloatX", "uFloatA", "uFloatB"]);
    this.externalFuncs = [glslFuncs.gaussian];
  }

  setX(x: Float | number) {
    this.setUniform("uFloatX" + this.id, x);
  }

  setA(a: Float | number) {
    this.setUniform("uFloatA" + this.id, a);
  }

  setB(b: Float | number) {
    this.setUniform("uFloatB" + this.id, b);
  }
}

export function gaussian(
  x: Float | number,
  a: Float | number = 0,
  b: Float | number = 1
) {
  return new GaussianExpr(n2e(x), n2e(a), n2e(b));
}
