import { Effect, tag, Vec3 } from "../effect";
import { glslFuncs } from "../glslfunctions";

export class HSB extends Effect {
  /**
   * @param vec hue, sat and brightness components
   * @param mask which original color components to zero out and which to keep
   * (defaults to only zeroing out all of original color)
   */
  constructor(vec: Vec3, mask: Vec3 = [0, 0, 0]) {
    super(tag`void main () {
  vec3 hsb = rgb2hsb(gl_FragColor.rgb);
  vec3 m = ${mask};
  hsb.xyz = (vec3(1., 1., 1.) - m) * ${vec} + m * hsb.xyz;
  vec3 rgb = hsb2rgb(hsb);
  gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
}`);
    this.externalFuncs = [glslFuncs.hsb2rgb, glslFuncs.rgb2hsb];
  }
}
