import { ExprVec4, tag, PrimitiveFloat, n2e } from "./expr";
import { Float } from "../exprtypes";
import { fcolor } from "./fragcolorexpr";
import { glslFuncs } from "../glslfunctions";

export class Brightness extends ExprVec4 {
  constructor(val: Float, col: ExprVec4 = fcolor()) {
    super(tag`(brightness(${val}, ${col}))`, ["uBrightness", "uColor"]);
    this.externalFuncs = [glslFuncs.brightness];
  }

  setBrightness(brightness: PrimitiveFloat | number) {
    this.setUniform("uBrightness" + this.id, n2e(brightness));
  }
}

export function brightness(val: Float | number, col?: ExprVec4) {
  return new Brightness(n2e(val), col);
}
