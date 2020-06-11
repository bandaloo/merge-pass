import { Expr, BuildInfo, parse } from "../effects/expression";
import { Float, Vec2, Vec4, Vec3 } from "../effect";

class VecExpr<Vec> extends Expr<Vec> {
  components: Float[];

  constructor(...components: Float[]) {
    super();
    this.components = components;
  }

  parse(bi: BuildInfo): string {
    let counter = 0;
    const list = this.components.map((comp) => {
      return parse(comp, "uComp" + counter++ + this.idStr, this, bi);
    });
    return `(vec${this.components.length}(${list.join(", ")}))`;
  }
}

export function vec(...components: Float[]) {
  switch (components.length) {
    case 2:
      return new VecExpr<Vec2>(...components);
    case 3:
      return new VecExpr<Vec3>(...components);
    case 4:
      return new VecExpr<Vec4>(...components);
    default:
      throw new Error("wrong number of components for vec");
  }
}
