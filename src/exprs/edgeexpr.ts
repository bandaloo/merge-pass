import { Float, Vec4 } from "../exprtypes";
import { brightness } from "./brightnessexpr";
import { mut, PrimitiveFloat, wrapInValue, WrappedExpr } from "./expr";
import { getcomp } from "./getcompexpr";
import { invert } from "./invertexpr";
import { monochrome } from "./monochromeexpr";
import { op, OpExpr } from "./opexpr";
import { sobel } from "./sobelexpr";

export class EdgeExpr extends WrappedExpr<Vec4> {
  mult: Float;
  operator: OpExpr<Float, Float>;

  constructor(mult: Float = mut(-1.0), samplerNum?: number) {
    const operator = op(
      getcomp(invert(monochrome(sobel(samplerNum))), "r"),
      "*",
      mult
    );
    super(brightness(operator));
    this.mult = mult;
    this.operator = operator;
  }

  setMult(mult: PrimitiveFloat | number) {
    this.operator.setRight(mult);
    this.mult = wrapInValue(mult);
  }
}

/**
 * returns an expression highlights edges where they appear
 * @param style `"dark"` for dark edges and `"light"` for light edges, or a
 * custom number or expression (between -1 and 1) for a more gray style of edge
 * @param samplerNum where to sample from
 */
export function edge(
  style: Float | number | "dark" | "light",
  samplerNum?: number
) {
  const mult = style === "dark" ? -1 : style === "light" ? 1 : style;
  return new EdgeExpr(wrapInValue(mult), samplerNum);
}
