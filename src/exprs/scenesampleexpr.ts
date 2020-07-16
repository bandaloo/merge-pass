import { Vec2 } from "../exprtypes";
import { ExprVec4, tag, PrimitiveVec2 } from "./expr";
import { pos } from "./normfragcoordexpr";

/** scene sample expression */
export class SceneSampleExpr extends ExprVec4 {
  coord: Vec2;

  constructor(coord: Vec2 = pos()) {
    super(tag`texture2D(uSceneSampler, ${coord})`, ["uCoord"]);
    this.coord = coord;
    this.needs.sceneBuffer = true;
  }

  /** sets coordinate where scene is being sampled from */
  setCoord(coord: PrimitiveVec2) {
    this.setUniform("uCoord", coord);
    this.coord = coord;
  }
}

/**
 * creates an expression that samples the original scene
 * @param vec where to sample the original scene texture (defaults to the
 * normalized frag coord, but change this if you want to transform the
 * coordinate space of the original image)
 */
export function input(vec?: Vec2) {
  return new SceneSampleExpr(vec);
}
