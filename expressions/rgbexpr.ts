import { Float } from "../effect";
import { Expr } from "../effects/expression";

class RGBExpr extends Expr<Float> {
  constructor(char: string) {
    super({ sections: [`(gl_FragColor.${char})`], values: [] }, []);
  }
}
