import { Vec2 } from "../exprtypes";
import { glslFuncs, replaceSampler } from "../glslfunctions";
import { ExprVec4, PrimitiveVec2, SourceLists } from "./expr";

function genBlurSource(
  direction: Vec2,
  taps: 5 | 9 | 13,
  buffer?: number
): SourceLists {
  return {
    sections: [`gauss${taps}${buffer === undefined ? "" : "_" + buffer}(`, ")"],
    values: [direction],
  };
}

function tapsToFuncSource(taps: 5 | 9 | 13) {
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
  constructor(direction: Vec2, taps: 5 | 9 | 13 = 5, samplerNum?: number) {
    // this is already guaranteed by typescript
    if (![5, 9, 13].includes(taps)) {
      throw new Error("taps for gauss blur can only be 5, 9 or 13");
    }
    super(genBlurSource(direction, taps, samplerNum), ["uDirection"]);
    if (samplerNum === undefined) {
      this.needs.neighborSample = true;
      this.externalFuncs = [tapsToFuncSource(taps)];
    } else {
      this.needs.extraBuffers = new Set([samplerNum]);
      console.log("taps", taps);
      console.log("samplerNum", samplerNum);
      this.externalFuncs = [
        replaceSampler(
          tapsToFuncSource(taps),
          /vec4\sgauss[0-9]+/g,
          samplerNum
        ),
      ];
    }
  }

  setDirection(direction: PrimitiveVec2) {
    this.setUniform("uDirection" + this.id, direction);
  }
}

export function gauss(
  direction: Vec2,
  taps: 5 | 9 | 13 = 5,
  samplerNum?: number
) {
  return new BlurExpr(direction, taps, samplerNum);
}
