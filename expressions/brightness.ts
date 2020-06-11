/*
import { Effect, tag, Float, RawFloat } from "../effect";

export class Brightness extends Effect {
  constructor(val: Float) {
    super(
      tag`void main() {
  gl_FragColor.rgb /= gl_FragColor.a;
  gl_FragColor.rgb += ${val};
  gl_FragColor.rgb *= gl_FragColor.a;
}`,
      ["uBrightness"]
    );
  }

  setDirection(brightness: RawFloat) {
    this.setUniform("uBrightness" + this.idStr, brightness);
  }
}
*/
