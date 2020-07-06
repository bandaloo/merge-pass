import { Vec2 } from "../exprtypes";
import { ExprVec4, tag } from "./expr";
import { nfcoord } from "./normfragcoordexpr";

export class SceneSampleExpr extends ExprVec4 {
  coord: Vec2;

  constructor(coord: Vec2 = nfcoord()) {
    super(tag`texture2D(uSceneSampler, ${coord})`, ["uCoord"]);
    this.coord = coord;
    this.needs.sceneBuffer = true;
  }

  setCoord(coord: Vec2) {
    this.setUniform("uCoord", coord);
    this.coord = coord;
  }
}

/**
 * creates an expression that samples the scene
 * @param vec where to sample the original scene texture (defaults to the normalized frag
 * coord, but change this if you want to deform the original image)
 */
export function input(vec?: Vec2) {
  return new SceneSampleExpr(vec);
}
