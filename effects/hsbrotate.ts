import { Effect, tag, Float } from "../effect";
import { glslFuncs } from "../glslfunctions";

export class HSBRotate extends Effect {
  constructor(angle: Float) {
    super(
      tag`void main () {
  vec3 hsb = rgb2hsb(gl_FragColor.rgb);
  hsb.x += ${angle};
  vec3 rgb = hsb2rgb(hsb);
  gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
}`
    );
    this.externalFuncs = [glslFuncs.hsb2rgb, glslFuncs.rgb2hsb];
  }
}
