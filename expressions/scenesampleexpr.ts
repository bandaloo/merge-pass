import { ExprVec4, tag } from "./expr";
import { nfcoord } from "./normfragcoordexpr";
import { Vec2 } from "../exprtypes";

export class SceneSampleExpr extends ExprVec4 {
  constructor(coord: Vec2 = nfcoord()) {
    super(tag`(texture2D(uSceneSampler, ${coord}))`, ["uVec"]);
    this.needs.sceneBuffer = true;
    this.needs.centerSample = false;
  }
}

export function input(vec?: Vec2) {
  return new SceneSampleExpr(vec);
}
