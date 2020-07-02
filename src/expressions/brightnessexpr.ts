import { Float, Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, n2e, tag } from "./expr";
import { fcolor } from "./fragcolorexpr";

export class Brightness extends ExprVec4 {
  brightness: Float;

  constructor(brightness: Float, col: Vec4 = fcolor()) {
    super(tag`(brightness(${brightness}, ${col}))`, ["uBrightness", "uColor"]);
    this.brightness = brightness;
    this.externalFuncs = [glslFuncs.brightness];
  }

  setBrightness(brightness: Float | number) {
    this.setUniform("uBrightness" + this.id, brightness);
    this.brightness = n2e(brightness);
  }
}

export function brightness(val: Float | number, col?: ExprVec4) {
  return new Brightness(n2e(val), col);
}
