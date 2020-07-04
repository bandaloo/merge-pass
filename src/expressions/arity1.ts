import { AllVals } from "../exprtypes";
import { Operator, PrimitiveFloat, SourceLists, wrapInValue } from "./expr";

// these all work on genTypeX so it should be okay to sub in any of these
// strings (genTypeX is term from Khronos documentation)
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
  | "ceil"
  | "abs";

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

  setVal(val: T | number) {
    this.setUniform("uVal" + this.id, val);
    // TODO way to get rid of this cast?
    this.val = wrapInValue(val) as T;
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
