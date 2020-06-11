import { Effect, tag, Vec2, RawVec2 } from "../effect";

// adapted from https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/5.glsl
export class Blur extends Effect {
  constructor(direction: Vec2) {
    super(
      tag`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 direction = ${direction}; 
  gl_FragColor = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  gl_FragColor += texture2D(uSampler, uv) * 0.29411764705882354;
  gl_FragColor += texture2D(uSampler, uv + (off1 / uResolution)) * 0.35294117647058826;
  gl_FragColor += texture2D(uSampler, uv - (off1 / uResolution)) * 0.35294117647058826;
}`,
      ["uDirection"]
    );
    this.needs.neighborSample = true;
    // TODO change this back!!!
    this.needs.centerSample = true;
  }

  setDirection(direction: RawVec2) {
    this.setUniform("uDirection" + this.idStr, direction);
  }
}
