import { Vec, Vec3, Vec2, Vec4, TypeString } from "../exprtypes";
import { ExprFloat, ExprVec2, ExprVec3, ExprVec4, SourceLists } from "./expr";

// TODO this should probably be somewhere else
export function typeStringToLength(str: TypeString) {
  switch (str) {
    case "float":
      return 1;
    case "vec2":
      return 2;
    case "vec3":
      return 3;
    case "vec4":
      return 4;
  }
}

function genCompSource(vec: Vec, components: string): SourceLists {
  return {
    sections: ["", "." + components],
    values: [vec],
  };
}

export function checkLegalComponents(comps: string, vec: Vec) {
  const check = (range: string, domain: string) => {
    let inside = 0;
    let outside = 0;
    for (const c of range) {
      domain.includes(c) ? inside++ : outside++;
    }
    return inside === inside && !outside;
  };

  const inLen = typeStringToLength(vec.typeString());
  const rgbaCheck = check(comps, "rgba".substr(0, inLen));
  const xyzwCheck = check(comps, "xyzw".substr(0, inLen));
  const stpqCheck = check(comps, "stpq".substr(0, inLen));
  if (!(rgbaCheck || xyzwCheck || stpqCheck)) {
    throw new Error("component sets are mixed or incorrect entirely");
  }
}

function checkGetComponents(comps: string, outLen: number, vec: Vec) {
  if (comps.length > outLen) throw new Error("too many components");
  checkLegalComponents(comps, vec);
}

export class GetCompExpr extends ExprFloat {
  constructor(vec: Vec, comps: string) {
    checkGetComponents(comps, 1, vec);
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export class Get2CompExpr extends ExprVec2 {
  constructor(vec: Vec2 | Vec3 | Vec4, comps: string) {
    checkGetComponents(comps, 2, vec);
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export class Get3CompExpr extends ExprVec3 {
  constructor(vec: Vec3 | Vec4, comps: string) {
    checkGetComponents(comps, 3, vec);
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export class Get4CompExpr extends ExprVec4 {
  constructor(vec: Vec | Vec4, comps: string) {
    checkGetComponents(comps, 4, vec);
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export function getcomp(vec: Vec, comps: string) {
  return new GetCompExpr(vec, comps);
}

export function get2comp(vec: Vec2 | Vec3 | Vec4, comps: string) {
  return new Get2CompExpr(vec, comps);
}

export function get3comp(vec: Vec3 | Vec4, comps: string) {
  return new Get3CompExpr(vec, comps);
}

export function get4comp(vec: Vec4, comps: string) {
  return new Get4CompExpr(vec, comps);
}
