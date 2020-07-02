import { Float } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import { ExprVec4, n2e, tag } from "./expr";

export class GrainExpr extends ExprVec4 {
  grain: Float;

  constructor(grain: Float) {
    // TODO compose with other expressions rather than write full glsl?
    super(
      tag`vec4((1.0 - ${grain} * random(gl_FragCoord.xy)) * gl_FragColor.rgb, gl_FragColor.a);`,
      ["uGrain"]
    );
    this.grain = grain;
    this.externalFuncs = [glslFuncs.random];
    // TODO get rid of this if we choose to use fcolor instead later
    this.needs.centerSample = true;
  }

  setGrain(grain: Float | number) {
    this.setUniform("uGrain" + this.id, grain);
    this.grain = n2e(grain);
  }
}

export function grain(val: Float | number) {
  return new GrainExpr(n2e(val));
}
