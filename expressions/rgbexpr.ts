import { ExprFloat } from "./expr";

class RGBExpr extends ExprFloat {
  constructor(char: string) {
    super({ sections: [`(gl_FragColor.${char})`], values: [] }, []);
  }
}
