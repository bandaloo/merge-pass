import { Vec2 } from "../exprtypes";
import { ExprVec4, tag } from "./expr";
import { nfcoord } from "./normfragcoordexpr";

export class SceneSampleExpr extends ExprVec4 {
  constructor(coord: Vec2 = nfcoord()) {
    super(tag`texture2D(uSceneSampler, ${coord})`, ["uCoord"]);
    this.needs.sceneBuffer = true;
  }

  setCoord(coord: Vec2) {
    this.setUniform("uCoord", coord);
  }
}

export function input(vec?: Vec2) {
  return new SceneSampleExpr(vec);
}
