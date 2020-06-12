import { Expr, SourceLists } from "./expressions/expr";
import { getVecSize } from "./expressions/vecexprs";

// originally: export class Operator<T extends Operator<T> | Expr> extends Expr {
export class Operator<T extends Expr> extends Expr {
  ret: T;

  constructor(ret: T, sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
    this.ret = ret;
  }

  getSize(): number {
    return getVecSize(this.ret);
  }
}
