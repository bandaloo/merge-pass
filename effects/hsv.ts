import { Effect, tag, Vec3, RawVec3 } from "../effect";
import { glslFuncs } from "../glslfunctions";

export class HSV extends Effect {
  /**
   * @param components hue, sat and brightness components
   * @param mask which original color components to zero out and which to keep
   * (defaults to only zeroing out all of original color)
   */
  constructor(components: Vec3, mask: Vec3 = [0, 0, 0]) {
    super(
      tag`void main () {
  vec3 hsv = rgb2hsv(gl_FragColor.rgb);
  vec3 m = ${mask};
  hsv.xyz = (vec3(1., 1., 1.) - m) * ${components} + m * hsv.xyz;
  vec3 rgb = hsv2rgb(hsv);
  gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
}`,
      ["uComponent", "uMask"]
    );
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }

  setComponents(components: RawVec3) {
    this.setUniform("uComponent", components);
  }

  setMask(mask: RawVec3) {
    this.setUniform("uMask", mask);
  }
}
