import { Effect, tag, Float } from "../effect";

export class Contrast extends Effect {
  constructor(val: Float) {
    if (val <= 0) {
      throw new Error("contrast must be > 0");
    }
    super(
      tag`void main() {
  gl_FragColor.rgb /= gl_FragColor.a;
  gl_FragColor.rgb = ((gl_FragColor.rgb - 0.5) * ${val}) + 0.5;
  gl_FragColor.rgb *= gl_FragColor.a;
}`
    );
  }
}
