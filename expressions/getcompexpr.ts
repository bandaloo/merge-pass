import { Vec, Vec3, Vec2, Vec4 } from "../exprtypes";
import { ExprFloat, ExprVec2, ExprVec3, ExprVec4, SourceLists } from "./expr";

function genCompSource(vec: Vec, components: string): SourceLists {
  return {
    sections: ["", "." + components],
    values: [vec],
  };
}

export class GetCompExpr extends ExprFloat {
  constructor(vec: Vec, comps: string) {
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export class Get2CompExpr extends ExprVec2 {
  constructor(vec: Vec2 | Vec3 | Vec4, comps: string) {
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export class Get3CompExpr extends ExprVec3 {
  constructor(vec: Vec3 | Vec4, comps: string) {
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

export class Get4CompExpr extends ExprVec4 {
  constructor(vec: Vec | Vec4, comps: string) {
    super(genCompSource(vec, comps), ["uVec"]);
  }
}

// TODO error checking for correct components

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
