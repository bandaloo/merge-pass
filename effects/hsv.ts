import { Effect, tag, Vec3 } from "../effect";
import { glslFuncs } from "../glslfunctions";

export class HSV extends Effect {
  /**
   * @param vec hue, sat and brightness components
   * @param mask which original color components to zero out and which to keep
   * (defaults to only zeroing out all of original color)
   */
  constructor(vec: Vec3, mask: Vec3 = [0, 0, 0]) {
    super(
      tag`void main () {
  vec3 hsv = rgb2hsv(gl_FragColor.rgb);
  vec3 m = ${mask};
  hsv.xyz = (vec3(1., 1., 1.) - m) * ${vec} + m * hsv.xyz;
  vec3 rgb = hsv2rgb(hsv);
  gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
}`,
      ["uVec", "uMask"]
    );
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}
