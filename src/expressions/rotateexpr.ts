import { ExprVec2, tag, n2e } from "./expr";
import { glslFuncs } from "../glslfunctions";
import { Vec2, Float } from "../exprtypes";

export class RotateExpr extends ExprVec2 {
  vec: Vec2;
  angle: Float;

  constructor(vec: Vec2, angle: Float) {
    super(tag`rotate2d(${vec}, ${angle})`, ["uVec", "uAngle"]);
    this.vec = vec;
    this.angle = angle;
    this.externalFuncs = [glslFuncs.rotate2d];
  }

  setVec(vec: Vec2) {
    this.setUniform("uVec" + this.id, vec);
    this.vec = vec;
  }

  setAngle(angle: Float | number) {
    this.setUniform("uAngle" + this.id, n2e(angle));
    this.angle = n2e(angle);
  }
}

export function rotate(vec: Vec2, angle: Float | number) {
  return new RotateExpr(vec, n2e(angle));
}
