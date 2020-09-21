import { channelSamplerName } from "../codebuilder";
import { Vec2 } from "../exprtypes";
import { ExprVec4, SourceLists, PrimitiveVec2 } from "./expr";
import { pos } from "./normfragcoordexpr";
import { glslFuncs } from "../glslfunctions";

/** @ignore */
function genChannelSampleSource(buf: number, coord: Vec2): SourceLists {
  return {
    sections: ["channel(", `, ${channelSamplerName(buf)})`],
    values: [coord],
  };
}

// TODO create a way to sample but not clamp by region

/** channel sample expression */
export class ChannelSampleExpr extends ExprVec4 {
  coord: Vec2;

  constructor(buf: number, coord: Vec2 = pos()) {
    super(genChannelSampleSource(buf, coord), ["uVec"]);
    this.coord = coord;
    this.externalFuncs = [glslFuncs.channel];
    if (buf !== -1) this.needs.extraBuffers = new Set([buf]);
    else this.needs.neighborSample = true;
  }

  setCoord(coord: PrimitiveVec2) {
    this.setUniform("uVec", coord);
    this.coord = coord;
  }
}

/**
 * creates an expression that samples from one of the user-defined channels.
 * don't sample from the same channel that you are using [[target]] on in a
 * loop, just use [[fcolor]]
 * @param channel which channel to sample from
 * @param vec where to sample the channel texture (defaults to the normalized
 * frag coord)
 */
export function channel(channel: number, vec?: Vec2) {
  return new ChannelSampleExpr(channel, vec);
}
