// TODO make this more than just number
interface Uniforms {
  [name: string]: number | number[];
}

interface EffectOptions {
  needsDepthBuffer?: boolean;
  pingPongNum?: number;
  fShaderSource: string;
  uniforms?: Uniforms;
}

export class Effect {
  needsDepthBuffer: boolean;
  pingPongNum: number;
  fShaderSource: string;
  uniforms: Uniforms;

  constructor(options: EffectOptions) {
    this.needsDepthBuffer = options?.needsDepthBuffer ?? false;
    this.pingPongNum = options?.pingPongNum ?? 0;
    this.fShaderSource = options.fShaderSource;
    this.uniforms = options?.uniforms ?? {};
  }
}

// TODO consider how effects can potentially use functions outside
export function darken(percent: number) {
  if (percent < 0 || percent > 100) {
    throw new Error("darkness percent must be between 0 and 100 (inclusive)");
  }
  return new Effect({
    fShaderSource: `void main() {
  float d = ${toGLSLFloatString(percent / 100)};
  gl_FragColor = vec4(d * gl_FragColor.rgb, gl_FragColor.a);
}`,
  });
}

export function invert() {
  return new Effect({
    fShaderSource: `void main() {
  gl_FragColor = vec4(1.0 - gl_FragColor.rgb, gl_FragColor.a);
}`,
  });
}

export function red() {
  return new Effect({
    fShaderSource: `void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`,
  });
}

function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}
