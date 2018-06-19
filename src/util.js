const turf = require("@turf/turf");

function sum(array, key=(value => value)) {
    return array.reduce((sum, value) => sum + key(value), 0);
}

function start(lineStringFeature) {
    return turf.coordAll(lineStringFeature)[0];
}

function end(lineStringFeature) {
    const coordinates = turf.coordAll(lineStringFeature);
    return coordinates[coordinates.length-1];
}

function startsIn(lineStringFeature, polygonFeature) {
    return turf.booleanPointInPolygon(start(lineStringFeature), polygonFeature);
}

function endsIn(lineStringFeature, polygonFeature) {
    return turf.booleanPointInPolygon(end(lineStringFeature), polygonFeature);
}

function pointToPolygonDistance(coordinate, polygonFeature) {
    const polygonLines = turf.lineSegment(polygonFeature).features;
    const distances = polygonLines.map(line => turf.pointToLineDistance(coordinate, line));
    
    return Math.min(...distances);
}

/**
 * See also: `turf.booleanPointInPolygon`. However, it has no option to specify
 * a tolerance. There are instances where line segments from `turf.lineSplit(line, polygon)` 
 * return `false` for `turf.booleanPointInPolygon(segment.start/end, polygon`).
 */
function isCoordinateOnPolygonBoundary(coordinate, polygonFeature, tolerance) {  
    return pointToPolygonDistance(coordinate, polygonFeature) <= tolerance;
}

/**
 * Returns `true` if the line without start and end coordinates is fully within the polygon.
 * In case of a line with only two coordinates, checks the full line for inclusion.
 * 
 * Precondition: The line is split by the polygon (`turf.lineSplit`).
 * 
 * This is a simple heuristic to work around imprecisions in `turf.booleanWithin(line, polygon)`
 * where it can return `false` for an inner line split by the polygon because the start/end 
 * coordinates slightly cross the polygon boundary (due to `turf.lineSplit` imprecisions).
 */
function isInnerSegmentWithin(lineStringFeature, polygonFeature) {
    const coordinates = turf.coordAll(lineStringFeature);
    let innerLine;

    switch (coordinates.length) {
        case 0: case 1: throw "Line segment must have at least two coordinates";
        case 2: innerLine = coordinates; break;
        case 3: innerLine = [coordinates[1], coordinates[1]]; break;
        default: innerLine = coordinates.slice(1, -1);
    }

    return turf.booleanWithin(turf.lineString(innerLine), polygonFeature);
}

/**
 * Note: Assumes there is a feature property `type`.
 */
function activityTypes(activityFeatures) {
    return activityFeatures.reduce((types, feature) => {
        const count = types[feature.properties.type] || 0;
        types[feature.properties.type] = count + 1;
        return types;
    }, {});
}

function summarizeActivityTypes(activityFeatures) {
    return Object.entries(activityTypes(activityFeatures))
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry.join(": "))
        .join(", ");
}

module.exports = {
    sum, 
    start,
    end,
    startsIn,
    endsIn,
    pointToPolygonDistance,
    isCoordinateOnPolygonBoundary,
    isInnerSegmentWithin,
    activityTypes,
    summarizeActivityTypes
};