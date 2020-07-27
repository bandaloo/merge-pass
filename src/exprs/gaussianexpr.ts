import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprFloat, PrimitiveFloat, tag, wrapInValue } from "./expr";

/** gaussian expression */
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

  setX(x: PrimitiveFloat | number) {
    this.setUniform("uFloatX" + this.id, x);
    this.x = wrapInValue(x);
  }

  setA(a: PrimitiveFloat | number) {
    this.setUniform("uFloatA" + this.id, a);
    this.a = wrapInValue(a);
  }

  setB(b: PrimitiveFloat | number) {
    this.setUniform("uFloatB" + this.id, b);
    this.b = wrapInValue(b);
  }
}

/**
 * gaussian function that defaults to normal distribution
 * @param x x position in the curve
 * @param a horizontal position of peak (defaults to 0 for normal distribution)
 * @param b horizontal stretch of the curve (defaults to 1 for normal distribution)
 */
export function gaussian(
  x: Float | number,
  a: Float | number = 0,
  b: Float | number = 1
) {
  return new GaussianExpr(wrapInValue(x), wrapInValue(a), wrapInValue(b));
}
