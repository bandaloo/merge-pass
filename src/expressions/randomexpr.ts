import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag } from "./expr";

export class RandomExpr extends ExprVec4 {
  constructor() {
    super(tag`(random(gl_FragCoord.xy))`, []);
    this.externalFuncs = [glslFuncs.random];
  }
}
