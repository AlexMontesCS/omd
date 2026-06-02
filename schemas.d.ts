import type { OmdSchemaDefinition, OmdSchemas } from "./index.js";

declare const omdSchemas: OmdSchemas;
declare const omdSchemaTypes: string[];

export function getOmdSchema(omdType: string): OmdSchemaDefinition | null;
export function getOmdSchemaTypes(): string[];

export default omdSchemas;
export { omdSchemas, omdSchemaTypes };
