import * as httpModuleDef from 'tns-core-modules/http';


let debug = false;
export function setDebug(value: boolean) {
    debug = value;
}

export enum CLogTypes {
    info,
    warning,
    error
}

export const CLog = (type: CLogTypes = 0, ...args) => {
    if (debug) {
        if (type === 0) {
            // Info
            console.log('[nativescript-sensors]', ...args);
        } else if (type === 1) {
            // Warning
            console.warn('[nativescript-sensors]', ...args);
        } else if (type === 2) {
            console.error('[nativescript-sensors]', ...args);
        }
    }
};

/**
 *
 *
 * @export
 * @param pressure current pressure in hPa
 * @param airportPressure sea level pressure in hPa
 * @returns alitude in meters
 */
export function getAltitude(pressure: number, airportPressure: number) {
    return 44330 * (1 - Math.pow(pressure / airportPressure, 1 / 5.255));
}

interface AVWXResult {
    altimeter?: {
        value: number;
    };
    units: {
        altimeter: 'hPa' | 'inHg';
    };
    info: {
        icao: string;
        city: string;
        name: string;
        latitude: number;
        longitude: number;
        elevation_m: number;
    };
}

function handleAVWXResut(result: AVWXResult) {
    if (result.units.altimeter !== 'hPa') {
        result.altimeter.value *= 33.8638866667;
    }
    return {
        city: result.info.city,
        name: result.info.name,
        latitude: result.info.latitude,
        longitude: result.info.longitude,
        icao: result.info.icao,
        elevation: result.info.elevation_m,
        pressure: result.altimeter.value
    };
}

export function getAirportPressure(airport: string) {
    const httpModule = require('tns-core-modules/http') as typeof httpModuleDef;
    return httpModule.getJSON<AVWXResult>(`https://avwx.rest/api/metar/${airport}?options=info&format=json&onfail=cache`).then(result => {

        // returned pressure is in inHg
        if (!result.altimeter) {
            throw new Error(`airport not found ${airport}`);
        }
        return handleAVWXResut(result);
    });
}
export function getAirportPressureAtLocation(lat: number, lon: number) {
    const httpModule = require('tns-core-modules/http') as typeof httpModuleDef;
    return httpModule.getJSON<AVWXResult>(`https://avwx.rest/api/metar/${lat},${lon}?onfail=cache&options=info&format=json`).then(result => {

        // returned pressure is in inHg
        if (!result.altimeter) {
            throw new Error(`could not find airport pressure for location ${lat},${lon}`);
        }
        return handleAVWXResut(result);
    });
}
