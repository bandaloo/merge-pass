import { Float, Vec, NamedVec, RawVec, DefaultVec } from "../exprtypes";
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

export function vec2(comp1: Float, comp2: Float) {
  return new ExprVec2(...vecSourceList(comp1, comp2));
}

export function vec3(comp1: Float, comp2: Float, comp3: Float) {
  return new ExprVec3(...vecSourceList(comp1, comp2, comp3));
}

export function vec4(comp1: Float, comp2: Float, comp3: Float, comp4: Float) {
  return new ExprVec4(...vecSourceList(comp1, comp2, comp3, comp4));
}

export function getVecSize(vec: Vec): number {
  // expr
  if (vec instanceof VecExpr) {
    return vec.getSize();
  }

  let arr = vec as RawVec | NamedVec | DefaultVec;

  if (typeof arr[0] === "string") {
    // named
    const namedVec = arr as NamedVec;
    return namedVec[1].length;
  }

  if (typeof arr[0] === "number") {
    // raw
    const rawVec = arr as RawVec;
    return rawVec.length;
  }

  // default
  const defaultVec = arr as DefaultVec;
  return defaultVec[0].length;
}
