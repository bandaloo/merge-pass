import { Vec4 } from "../exprtypes";
import { a2 } from "./arity2";
import { cvec4, tag, WrappedExpr, PrimitiveVec4, ExprVec4 } from "./expr";
import { fcolor } from "./fragcolorexpr";
import { monochrome } from "./monochromeexpr";
import { sobel } from "./sobelexpr";
import { vec4 } from "./vecexprs";

/** edge color expression */
export class EdgeColorExpr extends WrappedExpr<Vec4> {
  color: Vec4;
  expr: ExprVec4;
  constructor(color: Vec4, samplerNum?: number, stepped = true) {
    const expr = stepped
      ? cvec4(
          tag`mix(${color}, ${fcolor()}, ${monochrome(
            a2("step", vec4(0.5, 0.5, 0.5, 0.0), sobel(samplerNum))
          )})`
        )
      : cvec4(
          tag`mix(${color}, ${fcolor()}, ${monochrome(sobel(samplerNum))})`
        );
    super(expr);
    this.color = color;
    this.expr = expr;
  }

  setColor(color: PrimitiveVec4) {
    this.expr.setUniform("uCustomName0" + this.expr.id, color);
    this.color = color;
  }
}

/**
 * creates a colored edge detection expression
 * @param color what color to make the edge
 * @param samplerNum where to sample from
 * @param stepped whether to round the result of sobel edge detection (defaults
 * to true)
 */
export function edgecolor(color: Vec4, samplerNum?: number, stepped?: boolean) {
  return new EdgeColorExpr(color, samplerNum, stepped);
}
