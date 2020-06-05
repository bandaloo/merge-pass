import { Vec3, Float, tag, Effect, Source, UniformVal } from "../effect";
import { HSB } from "./hsb";
import { glslFuncs } from "../glslfunctions";

export class HSBAdd extends HSB {
  constructor(vec: Vec3) {
    super(vec, [1, 1, 1]);
  }
}

/**
 * the `HueAdd` effect and the `SaturationAdd` effect differ in source code by
 * just one character, so this helper function gets rid of that repeated code.
 */
function genHSBSource(str: string, val: UniformVal): Source {
  return {
    sections: [
      `void main () {
  vec3 hsb = rgb2hsb(gl_FragColor.rgb);
  hsb.${str} += `,
      `;
  vec3 rgb = hsb2rgb(hsb);
  gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
}`,
    ],
    values: [val],
  };
}

/**
 * add to the hue (if you want to add to hue, saturation and brightness in the
 * same step, consider using the class `HSBAdd` instead)
 */
export class HueAdd extends Effect {
  constructor(num: Float) {
    super(genHSBSource("x", num));
    this.externalFuncs = [glslFuncs.hsb2rgb, glslFuncs.rgb2hsb];
  }
}

/**
 * add to the saturation (if you want to add to hue, saturation and brightness
 * in the same step, consider using the class `HSBAdd` instead)
 */
export class SaturationAdd extends Effect {
  constructor(num: Float) {
    super(genHSBSource("y", num));
    this.externalFuncs = [glslFuncs.hsb2rgb, glslFuncs.rgb2hsb];
  }
}
