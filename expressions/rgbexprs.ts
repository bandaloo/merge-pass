import { Expr, parse, BuildInfo } from "../effects/expression";
import { Float, Vec } from "../effect";

abstract class RGBExpr extends Expr<Float> {
  abstract char: string;

  constructor() {
    super();
  }

  parse(bi: BuildInfo): string {
    return `(gl_FragColor.${this.char})`;
  }
}

export class RedExpr extends RGBExpr {
  char: string;

  constructor() {
    super();
    this.char = "r";
  }
}

export class GreenExpr extends RGBExpr {
  char: string;

  constructor() {
    super();
    this.char = "g";
  }
}

export class BlueExpr extends RGBExpr {
  char: string;

  constructor() {
    super();
    this.char = "b";
  }
}
