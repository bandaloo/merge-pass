import { Float, Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag, PrimitiveFloat, wrapInValue } from "./expr";
import { fcolor } from "./fragcolorexpr";

/** brightness expression */
export class Brightness extends ExprVec4 {
  brightness: Float;

  constructor(brightness: Float, col: Vec4 = fcolor()) {
    super(tag`brightness(${brightness}, ${col})`, ["uBrightness", "uColor"]);
    this.brightness = brightness;
    this.externalFuncs = [glslFuncs.brightness];
  }

  /** set the brightness (should probably be between -1 and 1) */
  setBrightness(brightness: PrimitiveFloat | number) {
    this.setUniform("uBrightness" + this.id, brightness);
    this.brightness = wrapInValue(brightness);
  }
}

/**
 * changes the brightness of a color
 * @param val float for how much to change the brightness by (should probably be
 * between -1 and 1)
 * @param col the color to increase the brightness of (defaults to current
 * fragment color)
 */
export function brightness(val: Float | number, col?: Vec4) {
  return new Brightness(wrapInValue(val), col);
}
