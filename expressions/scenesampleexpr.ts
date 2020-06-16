import { ExprVec4, tag } from "./expr";
import { nfcoord } from "./normfragcoordexpr";
import { Vec2 } from "../exprtypes";

export class SceneSampleExpr extends ExprVec4 {
  constructor(coord: Vec2 = nfcoord()) {
    super(tag`(texture2D(uSceneSampler, ${coord}))`, []);
    this.needs.sceneBuffer = true;
  }
}
