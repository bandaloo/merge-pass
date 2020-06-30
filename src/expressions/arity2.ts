import { AllVals, Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import {
  Operator,
  PrimitiveFloat,
  tag,
  wrapInValue,
  SourceLists,
} from "./expr";

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
  constructor(name: Arity2HomogenousName, val1: T, val2: U) {
    super(val1, genArity1SourceList(name, val1, val2), ["uBase", "uExponent"]);
  }

  setFirstVal(left: T | number) {
    this.setUniform("uBase" + this.id, left);
  }

  setSecondVal(right: U | number) {
    this.setUniform("uExponent" + this.id, right);
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

export function a2(name: Arity2HomogenousName, val1: any, val2: any) {
  return new Arity2HomogenousExpr(name, wrapInValue(val1), wrapInValue(val2));
}
