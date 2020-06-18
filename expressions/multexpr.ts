import { AllVals, Float, Vec, Vec2, Vec3, Vec4 } from "../exprtypes";
import { n2p, Operator as Op, tag, wrapInValue } from "./expr";

export class MultExpr<T extends AllVals, U extends AllVals> extends Op<T> {
  left: T;
  right: U;

  constructor(left: T, right: U) {
    super(left, tag`(${left} * ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }

  setLeft(left: T | number) {
    this.setUniform("uLeft" + this.id, wrapInValue(left));
  }

  setRight(right: U | number) {
    this.setUniform("uRight" + this.id, wrapInValue(right));
  }
}

// arithmetic

export function mul(
  left: Float | number,
  right: Float | number
): MultExpr<Float, Float>;

// dot

export function mul(left: Vec2, right: Vec2): MultExpr<Vec2, Vec2>;

export function mul(left: Vec3, right: Vec3): MultExpr<Vec3, Vec3>;

export function mul(left: Vec4, right: Vec4): MultExpr<Vec4, Vec4>;

// scalar with vec

export function mul<T extends Vec>(
  left: T,
  right: Float | number
): MultExpr<T, Float>;

// implementation

export function mul(left: any, right: any) {
  return new MultExpr(wrapInValue(left), wrapInValue(right));
}
