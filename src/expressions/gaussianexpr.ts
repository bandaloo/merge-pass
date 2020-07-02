import { Float } from "../exprtypes";
import { ExprFloat, n2e, tag } from "./expr";
import { glslFuncs } from "../glslfunctions";

export class GaussianExpr extends ExprFloat {
  x: Float;
  a: Float;
  b: Float;
  constructor(x: Float, a: Float, b: Float) {
    super(tag`gaussian(${x}, ${a}, ${b})`, ["uFloatX", "uFloatA", "uFloatB"]);
    this.x = x;
    this.a = a;
    this.b = b;
    this.externalFuncs = [glslFuncs.gaussian];
  }

  setX(x: Float | number) {
    this.setUniform("uFloatX" + this.id, x);
    this.x = n2e(x);
  }

  setA(a: Float | number) {
    this.setUniform("uFloatA" + this.id, a);
    this.a = n2e(a);
  }

  setB(b: Float | number) {
    this.setUniform("uFloatB" + this.id, b);
    this.b = n2e(b);
  }
}

export function gaussian(
  x: Float | number,
  a: Float | number = 0,
  b: Float | number = 1
) {
  return new GaussianExpr(n2e(x), n2e(a), n2e(b));
}
