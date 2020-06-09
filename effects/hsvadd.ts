import { Vec3 } from "../effect";
import { HSV } from "./hsv";

export class HSVAdd extends HSV {
  constructor(vec: Vec3) {
    super(vec, [1, 1, 1]);
  }
}
