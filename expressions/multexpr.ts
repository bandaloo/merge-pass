import { Vec, AllVals, Vec2, Vec3, Vec4, Float } from "../exprtypes";
import { Operator as Op, tag } from "./expr";

export class MultExpr<T extends AllVals, U extends AllVals> extends Op<T> {
  constructor(left: T, right: U) {
    super(left, tag`(${left} * ${right})`, ["uLeft", "uRight"]);
  }

  setLeft(left: T) {
    this.setUniform("uLeft" + this.id, left);
  }

  setRight(right: U) {
    this.setUniform("uRight" + this.id, right);
  }
}

// arithmetic

export function mul(left: Float, right: Float): MultExpr<Float, Float>;

// dot

export function mul(left: Vec2, right: Vec2): MultExpr<Vec2, Vec2>;

export function mul(left: Vec3, right: Vec3): MultExpr<Vec3, Vec3>;

export function mul(left: Vec4, right: Vec4): MultExpr<Vec4, Vec4>;

// scalar with vec

export function mul<T extends Vec>(left: T, right: Float): MultExpr<T, Float>;

// implementation

export function mul<T extends AllVals, U extends AllVals>(left: T, right: U) {
  return new MultExpr(left, right);
}
