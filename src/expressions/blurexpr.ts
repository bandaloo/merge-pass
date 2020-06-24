import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag, PrimitiveVec2, SourceLists } from "./expr";

function genBlurSource(direction: Vec2, taps: 5 | 9 | 13): SourceLists {
  return {
    sections: [`gauss${taps}(`, ")"],
    values: [direction],
  };
}

function tapsToKey(taps: 5 | 9 | 13) {
  switch (taps) {
    case 5:
      return glslFuncs.gauss5;
    case 9:
      return glslFuncs.gauss9;
    case 13:
      return glslFuncs.gauss13;
  }
}

export class BlurExpr extends ExprVec4 {
  constructor(direction: Vec2, taps: 5 | 9 | 13 = 5) {
    super(genBlurSource(direction, taps), ["uDirection"]);
    this.externalFuncs = [tapsToKey(taps)];
    this.needs.neighborSample = true;
  }

  setDirection(direction: PrimitiveVec2) {
    this.setUniform("uDirection" + this.id, direction);
  }
}

export function gauss(direction: Vec2, taps: 5 | 9 | 13 = 5) {
  return new BlurExpr(direction, taps);
}
