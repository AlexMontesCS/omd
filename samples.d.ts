import type { OmdSampleJson, OmdSamples } from "./index.js";
export type { OmdSampleJson, OmdSamples };

declare const omdSamples: OmdSamples;
declare const omdSampleTypes: string[];

export function getOmdSample(omdType: string): OmdSampleJson[] | null;
export function getOmdSamples(omdType: string): OmdSampleJson[] | null;
export function getOmdSampleTypes(): string[];

export default omdSamples;
export { omdSamples, omdSampleTypes };
