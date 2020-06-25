import { Vec2 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, tag, PrimitiveVec2, SourceLists } from "./expr";

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
    super(genBlurSource(direction, taps, samplerNum), ["uDirection"]);
    if (samplerNum === undefined) {
      this.needs.neighborSample = true;
      this.externalFuncs = [tapsToFuncSource(taps)];
    } else {
      this.needs.extraBuffers = new Set([samplerNum]);
      console.log("taps", taps);
      console.log("samplerNum", samplerNum);
      this.externalFuncs = [
        // this relies on the fact that the string `uSampler` doesn't appear
        // elsewhere in the provided blur functions, which is currently a safe
        // assumption
        tapsToFuncSource(taps)
          .replace(/uSampler/g, "uBufferSampler" + samplerNum)
          .replace(/vec4\sgauss[0-9]+/g, `vec4 gauss${taps}_${samplerNum}`),
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
  // TODO move the optional argument to the constructor
  return new BlurExpr(direction, taps, samplerNum);
}
