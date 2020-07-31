import { AllVals } from "../exprtypes";
import { Operator, PrimitiveFloat, SourceLists, wrapInValue } from "./expr";

// these all work on genTypeX so it should be okay to sub in any of these
// strings (genTypeX is term from Khronos documentation)
/** valid function names for [[a1]] */
type Arity1HomogenousName =
  // trig
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
  // other
  | "floor"
  | "ceil"
  | "abs"
  | "sign"
  | "fract"
  | "min"
  | "max";

/** @ignore */
function genArity1SourceList(
  name: Arity1HomogenousName,
  val: AllVals
): SourceLists {
  return {
    sections: [name + "(", ")"],
    values: [val],
  };
}

/** arity 1 homogenous function expression */
export class Arity1HomogenousExpr<T extends AllVals> extends Operator<T> {
  val: T;

  constructor(val: T, operation: Arity1HomogenousName) {
    super(val, genArity1SourceList(operation, val), ["uVal"]);
    this.val = val;
  }

  /** set the value being passed into the arity 1 homogenous function */
  setVal(val: T | number) {
    this.setUniform("uVal" + this.id, val);
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

/**
 * built-in functions that take in one `genType x` and return a `genType x`
 * @param name function name (see [[Arity1HomogenousName]] for valid function names)
 * @param val the `genType x` argument
 */
export function a1<T extends AllVals>(
  name: Arity1HomogenousName,
  val: T | number
) {
  return new Arity1HomogenousExpr(wrapInValue(val), name);
}
