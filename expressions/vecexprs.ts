import { Float } from "../exprtypes";
import {
  SourceLists,
  ExprVec2,
  ExprVec3,
  ExprVec4,
  n2e,
  PrimitiveVec2,
} from "./expr";

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

// primitive vector shorthands

export function pvec2(comp1: number, comp2: number) {
  return new PrimitiveVec2([comp1, comp2]);
}

export function pvec3(comp1: number, comp2: number, comp3: number) {
  return new PrimitiveVec2([comp1, comp2, comp3]);
}

export function pvec4(
  comp1: number,
  comp2: number,
  comp3: number,
  comp4: number
) {
  return new PrimitiveVec2([comp1, comp2, comp3, comp4]);
}
