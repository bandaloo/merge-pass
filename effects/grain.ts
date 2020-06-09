import { Effect, tag, Float, RawFloat } from "../effect";
import { glslFuncs } from "..";

export class Grain extends Effect {
  constructor(val: Float) {
    super(
      tag`void main() {
  gl_FragColor = vec4((1.0 - ${val} * random(gl_FragCoord.xy)) * gl_FragColor.rgb, gl_FragColor.a);
}`,
      ["uGrain"]
    );
    this.externalFuncs = [glslFuncs.random];
  }

  setGrain(grain: RawFloat) {
    this.setUniform("uGrain" + this.idStr, grain);
  }
}
