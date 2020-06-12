import { Float, Vec2, Vec3, Vec4 } from "../exprtypes";
import { Expr } from "../effects/expression";

class VecExpr<Vec> extends Expr<Vec> {
  components: Float[];

  constructor(...components: Float[]) {
    // TODO test this
    const sections = ["(vec" + components.length];
    for (let i = 0; i < components.length - 1; i++) {
      sections.push(", ");
    }
    const defaultNames = [];
    for (let i = 0; i < components.length; i++) {
      defaultNames.push("uComp" + i);
    }
    sections.push(")");
    super({ sections: sections, values: components }, defaultNames);
    this.components = components;
  }

  /*
  eparse(bi: BuildInfo): string {
    let counter = 0;
    const list = this.components.map((comp) => {
      return vparse(comp, "uComp" + counter++ + this.id, this, bi);
    });
    return `(vec${this.components.length}(${list.join(", ")}))`;
  }
  */
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
