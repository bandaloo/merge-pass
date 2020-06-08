import { UniformVal, Source, Effect, Float } from "../effect";
import { glslFuncs } from "../glslfunctions";

function genHSVSource(
  component: "x" | "y" | "z",
  operation: "+" | "",
  val: UniformVal
): Source {
  return {
    sections: [
      `void main () {
  vec3 hsv = rgb2hsv(gl_FragColor.rgb);
  hsv.${component} ${operation}= `,
      `;
  vec3 rgb = hsv2rgb(hsv);
  gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, gl_FragColor.a);
}`,
    ],
    values: [val],
  };
}

export class HueAdd extends Effect {
  constructor(num: Float) {
    super(genHSVSource("x", "+", num), ["uHueAdd"]);
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}

export class SaturationAdd extends Effect {
  constructor(num: Float) {
    super(genHSVSource("y", "+", num), ["uSatAdd"]);
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}

export class ValueAdd extends Effect {
  constructor(num: Float) {
    super(genHSVSource("z", "+", num), ["uValAdd"]);
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}

export class Hue extends Effect {
  constructor(num: Float) {
    super(genHSVSource("x", "", num), ["uHue"]);
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}

export class Saturation extends Effect {
  constructor(num: Float) {
    super(genHSVSource("y", "", num), ["uSat"]);
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}

export class Value extends Effect {
  constructor(num: Float) {
    super(genHSVSource("z", "", num), ["uVal"]);
    this.externalFuncs = [glslFuncs.hsv2rgb, glslFuncs.rgb2hsv];
  }
}
