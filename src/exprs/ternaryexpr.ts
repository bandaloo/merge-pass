import { AllVals, Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import {
  Operator as Op,
  PrimitiveFloat,
  SourceLists,
  wrapInValue,
} from "./expr";

function genTernarySourceList(
  floats: Float[] | null,
  success: AllVals,
  failure: AllVals,
  not: boolean
) {
  const sourceList: SourceLists = {
    sections: [`(${not ? "!" : ""}(`],
    values: [],
  };

  let counter = 0;
  // generate the boolean expression
  if (floats !== null) {
    for (const f of floats) {
      counter++;
      const last = counter === floats.length;
      sourceList.values.push(f);
      sourceList.sections.push(` > 0.${last ? ") ? " : " && "}`);
    }
  } else {
    sourceList.sections[0] += "uCount == 0) ? ";
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

  constructor(floats: Float[] | null, success: T, failure: U, not: boolean) {
    super(success, genTernarySourceList(floats, success, failure, not), [
      ...(floats !== null
        ? Array.from(floats, (val, index) => "uFloat" + index)
        : []),
      "uSuccess",
      "uFailure",
    ]);
    this.success = success;
    this.failure = failure;
    this.needs.passCount = floats === null;
  }
}

export function ternary<T extends Float, U extends Float>(
  floats: (Float | number)[] | Float | number | null,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function ternary<T extends Float>(
  floats: (Float | number)[] | Float | number | null,
  success: T,
  failure: number,
  not?: boolean
): TernaryExpr<T, PrimitiveFloat>;
export function ternary<U extends Float>(
  floats: (Float | number)[] | Float | number | null,
  success: number,
  failure: U,
  not?: boolean
): TernaryExpr<PrimitiveFloat, U>;
export function ternary(
  floats: (Float | number)[] | Float | number | null,
  success: number,
  failure: number,
  not?: boolean
): TernaryExpr<PrimitiveFloat, PrimitiveFloat>;
export function ternary<T extends Vec2, U extends Vec2>(
  floats: (Float | number)[] | Float | number | null,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function ternary<T extends Vec3, U extends Vec3>(
  floats: (Float | number)[] | Float | number | null,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function ternary<T extends Vec4, U extends Vec4>(
  floats: (Float | number)[] | Float | number | null,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
/**
 * creates a ternary expression; the boolean expression is if all the floats
 * given are greater than 0
 * @param floats if all these floats (or the single float) are above 0, then
 * evaluates to success expression
 * @param success
 * @param failure
 * @param not whether to invert the ternary
 */
export function ternary(
  floats: (Float | number)[] | Float | number | null,
  success: any,
  failure: any,
  not = false
) {
  // TODO make this type safe (ran into a type error here)
  // wrap single float in array if need be
  if (!Array.isArray(floats) && floats !== null)
    floats = [floats].map((f) => wrapInValue(f));
  // TODO get rid of this cast
  return new TernaryExpr(
    floats as any,
    wrapInValue(success),
    wrapInValue(failure),
    not
  );
}
