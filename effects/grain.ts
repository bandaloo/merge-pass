import { Effect, tag, Float } from "../effect";
import { glslFuncs } from "..";

export class Grain extends Effect {
  constructor(val: Float) {
    super(tag`void main() {
  gl_FragColor = vec4((1.0 - ${val} * random(gl_FragCoord.xy)) * gl_FragColor.rgb, gl_FragColor.a);
}`);
    this.externalFuncs = [glslFuncs.random];
  }
}
