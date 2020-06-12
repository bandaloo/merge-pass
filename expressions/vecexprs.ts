import {
  Float,
  Vec,
  NamedUniformVal,
  NamedVec,
  RawVec,
  DefaultVec,
} from "../exprtypes";
import { ExprVec2, ExprVec3, ExprVec4, VecExpr, SourceLists } from "./expr";

function vecSourceList(...components: Float[]): [SourceLists, string[]] {
  const sections = ["vec" + components.length + "("];
  for (let i = 0; i < components.length - 1; i++) {
    sections.push(", ");
  }
  const defaultNames = [];
  for (let i = 0; i < components.length; i++) {
    defaultNames.push("uComp" + i);
  }
  sections.push(")");
  return [{ sections: sections, values: components }, defaultNames];
}

export function vec2(...components: Float[]) {
  return new ExprVec2(...vecSourceList(...components));
}

export function vec3(...components: Float[]) {
  return new ExprVec3(...vecSourceList(...components));
}

export function vec4(...components: Float[]) {
  return new ExprVec3(...vecSourceList(...components));
}

export function getVecSize(vec: Vec): number {
  // expr
  if (vec instanceof VecExpr) {
    return vec.getSize();
  }

  if (typeof vec[0] === "string") {
    // named
    const namedVec = vec as NamedVec;
    return namedVec[1].length;
  }

  if (typeof vec[0] === "number") {
    // raw
    const rawVec = vec as RawVec;
    return rawVec.length;
  }

  // default
  const defaultVec = vec as DefaultVec;
  return defaultVec[0].length;
}
