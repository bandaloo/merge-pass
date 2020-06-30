import { AllVals } from "../exprtypes";
import { Operator, SourceLists, wrapInValue, PrimitiveFloat } from "./expr";
import { Arity2HomogenousExpr } from "./arity2";

// these all work on (from khronos documentation) genType x so it should be okay
// to sub in any of these strings
// TODO can we just make this expression any function that takes 1 genTypeX and
// returns a genTypeX?
type Arity1HomogenousName =
  | "sin"
  | "cos"
  | "tan"
  | "sinh"
  | "cosh"
  | "tanh"
  | "asin"
  | "acos"
  | "atan"
  | "asinh"
  | "acosh"
  | "atanh"
  | "floor"
  | "ceil";

function genArity1SourceList(
  name: Arity1HomogenousName,
  val: AllVals
): SourceLists {
  return {
    sections: [name + "(", ")"],
    values: [val],
  };
}

export class Arity1HomogenousExpr<T extends AllVals> extends Operator<T> {
  val: T;

  constructor(val: T, operation: Arity1HomogenousName) {
    super(val, genArity1SourceList(operation, val), ["uVal"]);
    this.val = val;
  }

  setVal(right: T | number) {
    this.setUniform("uVal" + this.id, right);
  }
}

export function a1<T extends AllVals>(
  name: Arity1HomogenousName,
  val: T
): Arity1HomogenousExpr<T>;

export function a1<T extends AllVals>(
  name: Arity1HomogenousName,
  val: number
): Arity1HomogenousExpr<PrimitiveFloat>;

export function a1<T extends AllVals>(
  name: Arity1HomogenousName,
  val: T | number
) {
  return new Arity1HomogenousExpr(wrapInValue(val), name);
}
