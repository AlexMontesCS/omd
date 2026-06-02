import OMD_SCHEMAS from './schema/omd-schemas.json' with { type: 'json' };

export const omdSchemas = OMD_SCHEMAS;
export const omdSchemaTypes = Object.keys(OMD_SCHEMAS);

export function getOmdSchema(omdType) {
    return OMD_SCHEMAS[omdType] || null;
}

export function getOmdSchemaTypes() {
    return omdSchemaTypes.slice();
}

export default OMD_SCHEMAS;
