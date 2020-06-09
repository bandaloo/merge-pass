import { EffectLoop } from "../mergepass";
import { Blur } from "./blur";

export class PowerBlur extends EffectLoop {
  static baseLog = (x: number, y: number) => Math.log(y) / Math.log(x);

  private size: number;

  constructor(size: number) {
    const blurSide = new Blur([[size, 0]]);
    const blurUp = new Blur([[0, size]]);
    const reps = Math.ceil(PowerBlur.baseLog(2, size));
    super([blurSide, blurUp], {
      num: reps + 1,
    });
    this.size = size;
    this.repeat.func = (i) => {
      const distance = this.size / 2 ** i;
      blurSide.setDirection([distance, 0]);
      blurUp.setDirection([0, distance]);
    };
  }

  setSize(size: number) {
    this.size = size;
    this.repeat.num = Math.ceil(PowerBlur.baseLog(2, size));
  }
}
