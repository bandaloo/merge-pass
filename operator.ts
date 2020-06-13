import { Expr, SourceLists } from "./expressions/expr";
import { getUniformSize } from "./expressions/vecexprs";
import { Float } from "./exprtypes";

// originally: export class Operator<T extends Operator<T> | Expr> extends Expr {
export class Operator<T extends Expr | Float> extends Expr {
  ret: T;

  constructor(ret: T, sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
    this.ret = ret;
  }

  getSize(): number {
    return getUniformSize(this.ret);
  }
}
