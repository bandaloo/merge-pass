import { AllVals, Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import { Operator as Op, tag, wrapInValue } from "./expr";

export class AddExpr<T extends AllVals, U extends AllVals> extends Op<T> {
  left: T;
  right: U;

  constructor(left: T, right: U) {
    super(left, tag`(${left} + ${right})`, ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }

  setLeft(left: T | number) {
    this.setUniform("uLeft" + this.id, wrapInValue(left));
  }

  setRight(right: U | number) {
    this.setUniform("uRight" + this.id, this.right);
  }
}

// arithmetic

export function add(left: Float, right: Float): AddExpr<Float, Float>;

// vector addition

export function add(left: Vec2, right: Vec2): AddExpr<Vec2, Vec2>;

export function add(left: Vec3, right: Vec3): AddExpr<Vec3, Vec3>;

export function add(left: Vec4, right: Vec4): AddExpr<Vec4, Vec4>;

// implementation

export function add<T extends AllVals, U extends AllVals>(left: T, right: U) {
  return new AddExpr(left, right);
}
