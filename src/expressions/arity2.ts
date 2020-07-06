import { AllVals, Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import { Operator, PrimitiveFloat, wrapInValue, SourceLists } from "./expr";

type Arity2HomogenousName = "pow" | "step";

function genArity1SourceList(
  name: Arity2HomogenousName,
  val1: AllVals,
  val2: AllVals
): SourceLists {
  return {
    sections: [name + "(", ",", ")"],
    values: [val1, val2],
  };
}

export class Arity2HomogenousExpr<
  T extends AllVals,
  U extends AllVals
> extends Operator<T> {
  val1: T;
  val2: U;

  constructor(name: Arity2HomogenousName, val1: T, val2: U) {
    super(val1, genArity1SourceList(name, val1, val2), ["uVal1", "uVal2"]);
    this.val1 = val1;
    this.val2 = val2;
  }

  setFirstVal(val1: T | number) {
    this.setUniform("uVal1" + this.id, val1);
    // TODO get rid of this cast
    this.val1 = wrapInValue(val1) as T;
  }

  setSecondVal(val2: U | number) {
    this.setUniform("uVal2" + this.id, val2);
    // TODO get rid of this cast
    this.val2 = wrapInValue(val2) as U;
  }
}

// two floats

export function a2<T extends Float>(
  name: Arity2HomogenousName,
  val1: T,
  val2: number
): Arity2HomogenousExpr<T, PrimitiveFloat>;

export function a2<U extends Float>(
  name: Arity2HomogenousName,
  val1: number,
  val2: U
): Arity2HomogenousExpr<PrimitiveFloat, U>;

export function a2(
  name: Arity2HomogenousName,
  val1: number,
  val2: number
): Arity2HomogenousExpr<PrimitiveFloat, PrimitiveFloat>;

export function a2<T extends Float, U extends Float>(
  name: Arity2HomogenousName,
  val1: T,
  val2: U
): Arity2HomogenousExpr<T, U>;

// vecs with same length

export function a2<T extends Vec2, U extends Vec2>(
  name: Arity2HomogenousName,
  val1: T,
  val2: U
): Arity2HomogenousExpr<T, U>;

export function a2<T extends Vec3, U extends Vec3>(
  name: Arity2HomogenousName,
  val1: T,
  val2: U
): Arity2HomogenousExpr<T, U>;

export function a2<T extends Vec4, U extends Vec4>(
  name: Arity2HomogenousName,
  val1: T,
  val2: U
): Arity2HomogenousExpr<T, U>;

// implementation

/**
 * built-in functions that take in two `genType x` arguments and return a `genType x`
 * @param name function name (like "pow" or "step")
 * @param val1 the first `genType x` argument
 * @param val2 the second `genType x` argument
 */
export function a2(name: Arity2HomogenousName, val1: any, val2: any) {
  return new Arity2HomogenousExpr(name, wrapInValue(val1), wrapInValue(val2));
}
