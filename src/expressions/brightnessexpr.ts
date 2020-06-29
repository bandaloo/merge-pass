import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, n2e, tag } from "./expr";
import { fcolor } from "./fragcolorexpr";

export class Brightness extends ExprVec4 {
  constructor(val: Float, col: ExprVec4 = fcolor()) {
    super(tag`(brightness(${val}, ${col}))`, ["uBrightness", "uColor"]);
    this.externalFuncs = [glslFuncs.brightness];
  }

  setBrightness(brightness: Float | number) {
    this.setUniform("uBrightness" + this.id, brightness);
  }
}

export function brightness(val: Float | number, col?: ExprVec4) {
  return new Brightness(n2e(val), col);
}
