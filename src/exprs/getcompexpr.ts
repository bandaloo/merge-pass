import { TypeString, Vec } from "../exprtypes";
import { ExprFloat, ExprVec2, ExprVec3, ExprVec4, SourceLists } from "./expr";

// TODO this should probably be somewhere else
/** @ignore */
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

/** @ignore */
function genCompSource(vec: Vec, components: string): SourceLists {
  return {
    sections: ["", "." + components],
    values: [vec],
  };
}

/**
 * checks if components accessing a vector are legal. components can be illegal
 * if they mix sets (e.g. `v.rgzw`) or contain characters outside of any set
 * (e.g. `v.lmno`)
 * @param comps components string
 * @param vec vector being accessed
 */
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

/**
 * performs all validity checks of [[checkLegalComponents]] and checks if the
 * number of accessed components does not exceed the size of the vector being
 * assigned to
 * @param comps components string
 * @param outLen length of the resultant vector
 * @param vec vector being accessed
 */
function checkGetComponents(comps: string, outLen: number, vec: Vec) {
  if (comps.length > outLen) throw new Error("too many components");
  checkLegalComponents(comps, vec);
}

/** get component expression */
export class GetCompExpr<T extends Vec> extends ExprFloat {
  vec1Min: T;

  constructor(vec: T, comps: string) {
    checkGetComponents(comps, 1, vec);
    super(genCompSource(vec, comps), ["uVec1Min"]);
    this.vec1Min = vec;
  }

  setVec(vec: T) {
    this.setUniform("uVec1Min", vec);
    this.vec1Min = vec;
  }
}

/** get 2 components expression */
export class Get2CompExpr<T extends Vec> extends ExprVec2 {
  vec2Min: T;

  constructor(vec: T, comps: string) {
    checkGetComponents(comps, 2, vec);
    super(genCompSource(vec, comps), ["uVec2Min"]);
    this.vec2Min = vec;
  }

  setVec(vec: T) {
    this.setUniform("uVec2Min", vec);
    this.vec2Min = vec;
  }
}

/** get 3 components expression */
export class Get3CompExpr<T extends Vec> extends ExprVec3 {
  vec3Min: T;

  constructor(vec: T, comps: string) {
    checkGetComponents(comps, 3, vec);
    super(genCompSource(vec, comps), ["uVec3Min"]);
    this.vec3Min = vec;
  }

  setVec(vec: T) {
    this.setUniform("uVec3Min", vec);
    this.vec3Min = vec;
  }
}

/** get 3 components expression */
export class Get4CompExpr<T extends Vec> extends ExprVec4 {
  vec4Min: T;

  constructor(vec: T, comps: string) {
    checkGetComponents(comps, 4, vec);
    super(genCompSource(vec, comps), ["uVec4Min"]);
    this.vec4Min = vec;
  }

  setVec(vec: T) {
    this.setUniform("uVec4Min", vec);
    this.vec4Min = vec;
  }
}

/**
 * creates an expression that gets 1 component from a vector
 * @param vec the vector to get components of
 * @param comps components string
 */
export function getcomp<T extends Vec>(vec: T, comps: string) {
  return new GetCompExpr(vec, comps);
}

/**
 * creates an expression that gets 2 components from a vector
 * @param vec the vector to get components of
 * @param comps components string
 */
export function get2comp<T extends Vec>(vec: T, comps: string) {
  return new Get2CompExpr(vec, comps);
}

/**
 * creates an expression that gets 3 components from a vector
 * @param vec the vector to get components of
 * @param comps components string
 */
export function get3comp<T extends Vec>(vec: T, comps: string) {
  return new Get3CompExpr(vec, comps);
}

/**
 * creates an expression that gets 4 components from a vector
 * @param vec the vector to get components of
 * @param comps components string
 */
export function get4comp<T extends Vec>(vec: T, comps: string) {
  return new Get4CompExpr(vec, comps);
}
