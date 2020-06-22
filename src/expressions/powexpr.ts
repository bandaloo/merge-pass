import { AllVals, Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import { Operator, PrimitiveFloat, tag, wrapInValue } from "./expr";

export class PowExpr<T extends AllVals, U extends AllVals> extends Operator<T> {
  constructor(base: T, exponent: U) {
    super(base, tag`pow(${base}, ${exponent})`, ["uBase", "uExponent"]);
  }

  setBase(left: T | number) {
    this.setUniform("uBase" + this.id, wrapInValue(left));
  }

  setExponent(right: U | number) {
    this.setUniform("uExponent" + this.id, wrapInValue(right));
  }
}

// two floats

export function pow<T extends Float>(
  base: T,
  exponent: number
): PowExpr<T, PrimitiveFloat>;

export function pow<U extends Float>(
  base: number,
  exponent: U
): PowExpr<PrimitiveFloat, U>;

export function pow(
  base: number,
  exponent: number
): PowExpr<PrimitiveFloat, PrimitiveFloat>;

export function pow<T extends Float, U extends Float>(
  base: T,
  exponent: U
): PowExpr<T, U>;

// vecs with same length

export function pow<T extends Vec2, U extends Vec2>(
  base: T,
  exponent: U
): PowExpr<T, U>;

export function pow<T extends Vec3, U extends Vec3>(
  base: T,
  exponent: U
): PowExpr<T, U>;

export function pow<T extends Vec4, U extends Vec4>(
  base: T,
  exponent: U
): PowExpr<T, U>;

// implementation

export function pow(base: any, exponent: any) {
  return new PowExpr(wrapInValue(base), wrapInValue(exponent));
}
