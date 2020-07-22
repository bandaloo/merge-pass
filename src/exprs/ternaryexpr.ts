import { AllVals, Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import {
  Operator as Op,
  PrimitiveFloat,
  SourceLists,
  wrapInValue,
} from "./expr";

function genTernarySourceList(
  floats: Float[],
  success: AllVals,
  failure: AllVals
) {
  const sourceList: SourceLists = {
    sections: ["(("],
    values: [],
  };

  let counter = 0;
  // generate the boolean expression
  for (const f of floats) {
    counter++;
    const last = counter === floats.length;
    sourceList.values.push(f);
    sourceList.sections.push(` > 0.${last ? ") ? " : " && "}`);
  }
  // generate the success expression and colon
  sourceList.values.push(success);
  sourceList.sections.push(" : ");
  // generate the failure expression
  sourceList.values.push(failure);
  sourceList.sections.push(")");
  return sourceList;
}

export class TernaryExpr<T extends AllVals, U extends AllVals> extends Op<T> {
  success: T;
  failure: U;

  constructor(floats: Float[], success: T, failure: U) {
    super(success, genTernarySourceList(floats, success, failure), [
      ...Array.from(floats, (val, index) => "uFloat" + index),
      "uSuccess",
      "uFailure",
    ]);
    this.success = success;
    this.failure = failure;
  }
}

export function ternary<T extends Float, U extends Float>(
  floats: (Float | number)[] | Float | number,
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function ternary<T extends Float>(
  floats: (Float | number)[] | Float | number,
  success: T,
  failure: number
): TernaryExpr<T, PrimitiveFloat>;
export function ternary<U extends Float>(
  floats: (Float | number)[] | Float | number,
  success: number,
  failure: U
): TernaryExpr<PrimitiveFloat, U>;
export function ternary(
  floats: (Float | number)[] | Float | number,
  success: number,
  failure: number
): TernaryExpr<PrimitiveFloat, PrimitiveFloat>;
export function ternary<T extends Vec2, U extends Vec2>(
  floats: (Float | number)[] | Float | number,
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function ternary<T extends Vec3, U extends Vec3>(
  floats: (Float | number)[] | Float | number,
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function ternary<T extends Vec4, U extends Vec4>(
  floats: (Float | number)[] | Float | number,
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function ternary(
  floats: (Float | number)[] | Float | number,
  success: any,
  failure: any
) {
  // wrap single float in array if need be
  if (!Array.isArray(floats)) floats = [floats];
  return new TernaryExpr(
    // TODO what's up with the return type of this map?
    floats.map((f) => wrapInValue(f)),
    success,
    failure
  );
}
