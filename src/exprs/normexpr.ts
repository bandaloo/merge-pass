import { Vec } from "../exprtypes";
import { Operator, tag } from "./expr";

/** normalize expression */
export class NormExpr<T extends Vec> extends Operator<T> {
  vec: T;

  constructor(vec: T) {
    super(vec, tag`normalize(${vec})`, ["uVec"]);
    this.vec = vec;
  }

  /** sets the vec to normalize */
  setVec(vec: T) {
    this.setUniform("uVec" + this.id, vec);
    this.vec = vec;
  }
}

/** creates an expression that normalizes a vector */
export function norm<T extends Vec>(vec: T) {
  return new NormExpr(vec);
}
