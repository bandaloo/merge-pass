import { AllVals, Float, Vec, Vec2, Vec3, Vec4 } from "../exprtypes";
import { ArithOp } from "./changecompexpr";
import {
  Operator as Op,
  PrimitiveFloat,
  SourceLists,
  wrapInValue,
} from "./expr";

function genOpSourceList(
  left: AllVals,
  op: ArithOp,
  right: AllVals
): SourceLists {
  return {
    sections: ["(", ` ${op} `, ")"],
    values: [left, right],
  };
}

export class OpExpr<T extends AllVals, U extends AllVals> extends Op<T> {
  left: T;
  right: U;

  constructor(left: T, op: ArithOp, right: U) {
    super(left, genOpSourceList(left, op, right), ["uLeft", "uRight"]);
    this.left = left;
    this.right = right;
  }

  setLeft(left: T | number) {
    this.setUniform("uLeft" + this.id, left);
    this.left = wrapInValue(left) as T;
  }

  setRight(right: U | number) {
    this.setUniform("uRight" + this.id, right);
    this.right = wrapInValue(right) as U;
  }
}

// two floats

export function op<T extends Float>(
  left: T,
  op: ArithOp,
  right: number
): OpExpr<T, PrimitiveFloat>;

export function op<U extends Float>(
  left: number,
  op: ArithOp,
  right: U
): OpExpr<PrimitiveFloat, U>;

export function op(
  left: number,
  op: ArithOp,
  right: number
): OpExpr<PrimitiveFloat, PrimitiveFloat>;

export function op<T extends Float, U extends Float>(
  left: T,
  op: ArithOp,
  right: U
): OpExpr<T, U>;

// vecs with same length

export function op<T extends Vec2, U extends Vec2>(
  left: T,
  op: ArithOp,
  right: U
): OpExpr<T, U>;

export function op<T extends Vec3, U extends Vec3>(
  left: T,
  op: ArithOp,
  right: U
): OpExpr<T, U>;

export function op<T extends Vec4, U extends Vec4>(
  left: T,
  op: ArithOp,
  right: U
): OpExpr<T, U>;

// vec and float at right

export function op<T extends Vec, U extends Float>(
  left: T,
  op: ArithOp,
  right: U
): OpExpr<T, U>;

export function op<T extends Vec>(
  left: T,
  op: ArithOp,
  right: number
): OpExpr<T, PrimitiveFloat>;

// implementation

/**
 * creates an arithmetic operator expression
 * @param left expression left of operator
 * @param op string representing arithmetic operator
 * @param right expression right of operator
 */
export function op(left: any, op: ArithOp, right: any) {
  return new OpExpr(wrapInValue(left), op, wrapInValue(right));
}
