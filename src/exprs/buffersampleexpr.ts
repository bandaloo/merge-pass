import { channelSamplerName } from "../codebuilder";
import { Vec2 } from "../exprtypes";
import { ExprVec4, SourceLists } from "./expr";
import { nfcoord } from "./normfragcoordexpr";

function genBufferSamplerSource(buf: number, coord: Vec2): SourceLists {
  return {
    sections: [`texture2D(${channelSamplerName(buf)}, `, `)`],
    values: [coord],
  };
}

export class BufferSampleExpr extends ExprVec4 {
  coord: Vec2;

  constructor(buf: number, coord: Vec2 = nfcoord()) {
    super(genBufferSamplerSource(buf, coord), ["uVec"]);
    this.coord = coord;
    this.needs.extraBuffers = new Set([buf]);
  }

  setCoord(coord: Vec2) {
    this.setUniform("uVec", coord);
    this.coord = coord;
  }
}

/**
 * creates an expression that samples from one of the user-defined channels
 * @param channel which channel to sample from
 * @param vec where to sample the channel texture (defaults to the normalized
 * frag coord)
 */
export function channel(channel: number, vec?: Vec2) {
  return new BufferSampleExpr(channel, vec);
}
