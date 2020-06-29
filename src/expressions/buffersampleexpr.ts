import { bufferSamplerName } from "../codebuilder";
import { Vec2 } from "../exprtypes";
import { ExprVec4, SourceLists } from "./expr";
import { nfcoord } from "./normfragcoordexpr";

function genBufferSamplerSource(buf: number, coord: Vec2): SourceLists {
  return {
    sections: [`texture2D(${bufferSamplerName(buf)}, `, `)`],
    values: [coord],
  };
}

export class BufferSampleExpr extends ExprVec4 {
  constructor(buf: number, coord: Vec2 = nfcoord()) {
    super(genBufferSamplerSource(buf, coord), ["uVec"]);
    this.needs.extraBuffers = new Set([buf]);
  }
}

export function channel(channel: number, vec?: Vec2) {
  return new BufferSampleExpr(channel, vec);
}
