import { Float } from "../exprtypes";
import { SourceLists, ExprVec2, ExprVec3, ExprVec4, n2e } from "./expr";

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

export function vec2(comp1: Float | number, comp2: Float | number) {
  return new ExprVec2(...vecSourceList(...[comp1, comp2].map((c) => n2e(c))));
}

export function vec3(
  comp1: Float | number,
  comp2: Float | number,
  comp3: Float | number
) {
  return new ExprVec3(
    ...vecSourceList(...[comp1, comp2, comp3].map((c) => n2e(c)))
  );
}

export function vec4(
  comp1: Float | number,
  comp2: Float | number,
  comp3: Float | number,
  comp4: Float | number
) {
  return new ExprVec4(
    ...vecSourceList(...[comp1, comp2, comp3, comp4].map((c) => n2e(c)))
  );
}

// TODO! this will have to change
/*
export function getUniformSize(val: UniformVal): number {
  // expr
  if (val instanceof ExprVec) {
    return val.getSize();
  }

  // raw float
  if (typeof val === "number") {
    return 1;
  }

  // can't be raw float since that is just a number
  const arr = val as RawVec | NamedUniformVal | DefaultUniformVal;

  if (typeof arr[0] === "string") {
    // named
    const namedVal = arr as NamedVec;
    // float
    if (typeof namedVal === "number") return 1;
    // vec
    return namedVal[1].length;
  }

  if (typeof arr[0] === "number") {
    // raw vec
    const rawVec = arr as RawVec;
    return rawVec.length;
  }

  const defaultVal = arr as DefaultUniformVal;

  // default
  if (typeof defaultVal[0] === "number") {
    // float
    return 1;
  }
  // vec
  const defaultVec = arr as DefaultVec;
  return defaultVec[0].length;
}
*/
