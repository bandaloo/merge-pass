import { Operator, SourceLists } from "./expr";
import { Vec } from "../exprtypes";

function genCompSource(vec: Vec, components: string): SourceLists {
  return {
    sections: ["", "." + components, ""],
    values: [vec],
  };
}

export class GetCompExpr<T extends Vec> extends Operator<T> {
  constructor(vec: T, comps: string) {
    super(vec, genCompSource(vec, comps), ["uVec"]);
  }
}

// TODO error checking for correct components

export function getcomp(vec: Vec, comps: string) {
  return new GetCompExpr(vec, comps);
}
