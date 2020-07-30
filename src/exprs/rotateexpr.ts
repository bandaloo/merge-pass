import { Float, Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import {
  ExprVec2,
  PrimitiveFloat,
  PrimitiveVec2,
  tag,
  wrapInValue,
} from "./expr";

/** rotate expression */
export class RotateExpr extends ExprVec2 {
  vec: Vec2;
  angle: Float;

  constructor(vec: Vec2, angle: Float) {
    super(tag`rotate2d(${vec}, ${angle})`, ["uVec", "uAngle"]);
    this.vec = vec;
    this.angle = angle;
    this.externalFuncs = [glslFuncs.rotate2d];
  }

  /** set the vector to rotate */
  setVec(vec: PrimitiveVec2) {
    this.setUniform("uVec" + this.id, vec);
    this.vec = vec;
  }

  /** set the angle to rotate by */
  setAngle(angle: PrimitiveFloat | number) {
    this.setUniform("uAngle" + this.id, angle);
    this.angle = wrapInValue(angle);
  }
}

/**
 * creates an expression that rotates a vector by a given angle
 * @param vec the vector to rotate
 * @param angle radians to rotate vector by
 */
export function rotate(vec: Vec2, angle: Float | number) {
  return new RotateExpr(vec, wrapInValue(angle));
}
