import { AllVals } from "../exprtypes";
import { Operator, SourceLists, wrapInValue } from "./expr";

// TODO would it be okay to just include asin, acos, atan...
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

  setExponent(right: T | number) {
    this.setUniform("uVal" + this.id, wrapInValue(right));
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
