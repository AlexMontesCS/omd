import OMD_SAMPLES from './schema/omd-samples.json' with { type: 'json' };

export const omdSamples = OMD_SAMPLES;
export const omdSampleTypes = Object.keys(OMD_SAMPLES);

export function getOmdSample(omdType) {
    return OMD_SAMPLES[omdType] || null;
}

export function getOmdSamples(omdType) {
    return getOmdSample(omdType);
}

export function getOmdSampleTypes() {
    return omdSampleTypes.slice();
}

export default OMD_SAMPLES;
