import { Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import { EffectLoop, loop } from "../mergepass";
import { PrimitiveFloat, wrapInValue } from "./expr";
import { getcomp } from "./getcompexpr";
import { pos } from "./normfragcoordexpr";
import { op } from "./opexpr";
import { ternary, TernaryExpr } from "./ternaryexpr";
import { channel } from "./channelsampleexpr";
import { fcolor } from "./fragcolorexpr";

// form: x1, y1, x2, y2
function createDifferenceFloats(floats: Float[]) {
  const axes = "xy";
  const differences: Float[] = [];

  if (floats.length !== 4) {
    throw new Error("incorrect amount of points specified for region");
  }

  for (let i = 0; i < 2; i++) {
    differences.push(op(getcomp(pos(), axes[i]), "-", floats[i]));
  }

  for (let i = 2; i < floats.length; i++) {
    differences.push(op(floats[i], "-", getcomp(pos(), axes[i - 2])));
  }

  return differences;
}

export function region<T extends Float, U extends Float>(
  space: (Float | number)[] | Float | number,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function region<T extends Float>(
  space: (Float | number)[] | Float | number,
  success: T,
  failure: number,
  not?: boolean
): TernaryExpr<T, PrimitiveFloat>;
export function region<U extends Float>(
  space: (Float | number)[] | Float | number,
  success: number,
  failure: U,
  not?: boolean
): TernaryExpr<PrimitiveFloat, U>;
export function region(
  space: (Float | number)[] | Float | number,
  success: number,
  failure: number,
  not?: boolean
): TernaryExpr<PrimitiveFloat, PrimitiveFloat>;
export function region<T extends Vec2, U extends Vec2>(
  space: (Float | number)[] | Float | number,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function region<T extends Vec3, U extends Vec3>(
  space: (Float | number)[] | Float | number,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function region<T extends Vec4, U extends Vec4>(
  space: (Float | number)[] | Float | number,
  success: T,
  failure: U,
  not?: boolean
): TernaryExpr<T, U>;
export function region<U extends Vec4>(
  space: (Float | number)[] | Float | number,
  success: EffectLoop,
  failure: U,
  not?: boolean
): EffectLoop;
export function region<T extends Vec4>(
  space: (Float | number)[] | Float | number,
  success: T,
  failure: EffectLoop,
  not?: boolean
): EffectLoop;
export function region<U extends Vec4>(
  space: (Float | number)[] | Float | number,
  success: EffectLoop,
  failure: EffectLoop,
  not?: boolean
): EffectLoop;
/**
 * restrict an effect to a region of the screen
 * @param space top left, top right, bottom left, bottom right corners of the
 * region, or just a number if you wish to sample from a channel as the region
 * @param success expression for being inside the region
 * @param failure expression for being outside the region
 * @param not whether to invert the region
 */
export function region(
  space: (Float | number)[] | Float | number,
  success: any,
  failure: any,
  not = false
) {
  const floats: Float[] | Float = Array.isArray(space)
    ? space.map((f) => wrapInValue(f))
    : typeof space === "number"
    ? wrapInValue(space)
    : space;

  if (failure instanceof EffectLoop) {
    if (!(success instanceof EffectLoop)) {
      [success, failure] = [failure, success]; // swap the order
      not = !not; // invert the region
    }
  }

  if (success instanceof EffectLoop) {
    if (!(failure instanceof EffectLoop)) {
      return success.regionWrap(floats, failure, true, not);
    }
    // double loop, so we have to do separately
    return loop([
      success.regionWrap(floats, fcolor(), false, not),
      failure.regionWrap(floats, fcolor(), true, !not),
    ]);
  }

  return ternary(
    Array.isArray(floats) ? createDifferenceFloats(floats) : floats,
    success.brandExprWithRegion(floats),
    failure.brandExprWithRegion(floats),
    not
  );
}
