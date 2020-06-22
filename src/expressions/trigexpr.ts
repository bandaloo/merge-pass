import { AllVals } from "../exprtypes";
import { Operator, SourceLists } from "./expr";

type Trig = "sin" | "cos" | "tan";

function genTrigSourceList(operation: Trig, val: AllVals): SourceLists {
  return {
    sections: [operation + "(", ")"],
    values: [val],
  };
}

export class TrigExpr<T extends AllVals> extends Operator<T> {
  val: T;

  constructor(val: T, operation: Trig) {
    super(val, genTrigSourceList(operation, val), ["uVal"]);
    this.val = val;
  }
}

export function sin<T extends AllVals>(val: T) {
  return new TrigExpr(val, "sin");
}

export function cos<T extends AllVals>(val: T) {
  return new TrigExpr(val, "cos");
}

export function tan<T extends AllVals>(val: T) {
  return new TrigExpr(val, "tan");
}
