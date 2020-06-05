import { Effect, tag, Float } from "../effect";

export class Brightness extends Effect {
  constructor(val: Float) {
    super(
      tag`void main() {
  gl_FragColor.rgb /= gl_FragColor.a;
  gl_FragColor.rgb += ${val};
  gl_FragColor.rgb *= gl_FragColor.a;
}`
    );
  }
}
