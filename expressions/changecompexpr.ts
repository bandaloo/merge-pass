import { Operator } from "./expr";
import { Vec, AllVals } from "../exprtypes";

// test with just setting
function getChangeFunc(
  typ: string,
  id: string,
  setter: AllVals,
  comps: string
) {
  return `${typ} changecomp_${id}(${typ} col, ${setter.typeString()} setter) {
  col.${comps} = setter;
  return col;
}`;
}

export class ChangeCompExpr<T extends Vec> extends Operator<T> {
  constructor(vec: T, setter: AllVals, comps: string) {
    /** random hash to name a custom function */
    const hash = Math.random().toString(36).substring(5);
    console.log(hash);
    super(
      vec,
      { sections: [`changecomp_${hash}(`, ", ", ")"], values: [vec, setter] },
      ["uOriginal", "uNew"]
    );
    this.externalFuncs = [getChangeFunc(vec.typeString(), hash, setter, comps)];
  }
}

export function changecomp<T extends Vec>(
  vec: T,
  setter: AllVals,
  comps: string
) {
  return new ChangeCompExpr(vec, setter, comps);
}
