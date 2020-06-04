interface Uniforms {
    [name: string]: number | number[];
}
interface EffectOptions {
    needsDepthBuffer?: boolean;
    needsNeighborSample?: boolean;
    needsCenterSample?: boolean;
    repeatNum?: number;
    fShaderSource: string;
    uniforms?: Uniforms;
    externalFuncs?: string[];
}
export declare class Effect {
    needsDepthBuffer: boolean;
    needsNeighborSample: boolean;
    needsCenterSample: boolean;
    repeatNum: number;
    fShaderSource: string;
    uniforms: Uniforms;
    externalFuncs: string[];
    constructor(options: EffectOptions);
}
export declare function darken(percent: number): Effect;
export declare function invert(): Effect;
export declare function blur5(xDir: number, yDir: number): Effect;
export declare function red(): Effect;
export declare function nothing(): Effect;
export declare function fuzzy(): Effect;
export declare function repeat(effect: Effect, num: number): Effect;
export {};
