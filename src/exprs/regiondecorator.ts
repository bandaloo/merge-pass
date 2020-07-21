import { Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import { EffectLoop } from "../mergepass";
import { PrimitiveFloat, wrapInValue } from "./expr";
import { ternary, TernaryExpr } from "./ternaryexpr";
import { op } from "./opexpr";
import { getcomp } from "./getcompexpr";
import { pos } from "./normfragcoordexpr";

// form: x1, y1, x2, y2
function createDifferenceFloats(floats: Float[]) {
  const axes = "xy";
  const differences: Float[] = [];

  if (![2, 4].includes(floats.length)) {
    throw new Error("incorrect amount of points specified for region");
  }

  for (let i = 0; i < floats.length / 2; i++) {
    differences.push(op(getcomp(pos(), axes[i]), "-", floats[i]));
  }

  for (let i = floats.length / 2; i < floats.length; i++) {
    differences.push(
      op(floats[i], "-", getcomp(pos(), axes[i - floats.length / 2]))
    );
  }

  return differences;
}

// TODO overloads
export function region<T extends Float, U extends Float>(
  space: (Float | number)[],
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function region<T extends Float>(
  space: (Float | number)[],
  success: T,
  failure: number
): TernaryExpr<T, PrimitiveFloat>;
export function region<U extends Float>(
  space: (Float | number)[],
  success: number,
  failure: U
): TernaryExpr<PrimitiveFloat, U>;
export function region(
  space: (Float | number)[],
  success: number,
  failure: number
): TernaryExpr<PrimitiveFloat, PrimitiveFloat>;
export function region<T extends Vec2, U extends Vec2>(
  space: (Float | number)[],
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function region<T extends Vec3, U extends Vec3>(
  space: (Float | number)[],
  success: T,
  failure: U
): TernaryExpr<T, U>;
export function region<T extends Vec4, U extends Vec4>(
  space: (Float | number)[],
  success: T,
  failure: U
): TernaryExpr<T, U>;
// TODO make this work for loops and uncomment this
/*
export function region(
  space: (Float | number)[],
  success: EffectLoop,
  failure: EffectLoop
): EffectLoop;
*/
export function region(space: (Float | number)[], success: any, failure: any) {
  const floats = space.map((f) => wrapInValue(f));

  if (success instanceof EffectLoop) {
    throw new Error("TODO");
    //return;
  }
  return ternary(createDifferenceFloats(floats), success, failure);
}
