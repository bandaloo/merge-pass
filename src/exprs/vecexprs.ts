import { Float } from "../exprtypes";
import {
  BasicVec2,
  BasicVec3,
  BasicVec4,
  PrimitiveVec2,
  PrimitiveVec3,
  PrimitiveVec4,
  SourceLists,
  wrapInValue,
} from "./expr";

/** @ignore */
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

// expression vector shorthands

/** creates a basic vec2 expression */
export function vec2(comp1: Float | number, comp2: Float | number) {
  return new BasicVec2(
    ...vecSourceList(...[comp1, comp2].map((c) => wrapInValue(c)))
  );
}

/** creates a basic vec3 expression */
export function vec3(
  comp1: Float | number,
  comp2: Float | number,
  comp3: Float | number
) {
  return new BasicVec3(
    ...vecSourceList(...[comp1, comp2, comp3].map((c) => wrapInValue(c)))
  );
}

/** creates a basic vec4 expression */
export function vec4(
  comp1: Float | number,
  comp2: Float | number,
  comp3: Float | number,
  comp4: Float | number
) {
  return new BasicVec4(
    ...vecSourceList(...[comp1, comp2, comp3, comp4].map((c) => wrapInValue(c)))
  );
}

// primitive vector shorthands

/** creates a primitive vec2 expression */
export function pvec2(comp1: number, comp2: number) {
  return new PrimitiveVec2([comp1, comp2]);
}

/** creates a primitive vec3 expression */
export function pvec3(comp1: number, comp2: number, comp3: number) {
  return new PrimitiveVec3([comp1, comp2, comp3]);
}

/** creates a primitive vec4 expression */
export function pvec4(
  comp1: number,
  comp2: number,
  comp3: number,
  comp4: number
) {
  return new PrimitiveVec4([comp1, comp2, comp3, comp4]);
}
