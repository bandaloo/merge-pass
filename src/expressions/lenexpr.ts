import { Vec } from "../exprtypes";
import { ExprFloat, tag } from "./expr";

export class LenExpr<T extends Vec> extends ExprFloat {
  vec: T;

  constructor(vec: T) {
    super(tag`(length(${vec}))`, ["uVec"]);
    this.vec = vec;
  }

  setVec(vec: T) {
    this.setUniform("uVec" + this.id, vec);
    this.vec = vec;
  }
}

/** gets the length of a vector */
export function len<T extends Vec>(vec: T) {
  return new LenExpr(vec);
}
