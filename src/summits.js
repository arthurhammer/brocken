const turf = require("@turf/turf");
const util = require("./util");

function analyzeActivities(featureCollection, options) {
    return featureCollection.features
        .map(a => analyzeActivity(a, options));
}

function analyzeActivity(lineStringFeature, options) {
    const summit = options.summit;

    const isEmpty = turf.coordAll(lineStringFeature).length < 2;  // empty := less than two coordinates
    const endsOnSummit = isEmpty ? false : util.endsIn(lineStringFeature, summit);
    const startsOnSummit = isEmpty ? false : util.startsIn(lineStringFeature, summit);
    const fullyWithinSummit = isEmpty ? false : turf.booleanWithin(lineStringFeature, summit);

    const segments = isEmpty
        ? []
        : turf.lineSplit(lineStringFeature, summit).features.map(s => analyzeSegment(s, options));

    const summits = util.sum(segments, s => s.isValidSummit ? 1 : 0);

    return {
        activity: lineStringFeature,
        segments,
        summits,
        isEmpty,
        endsOnSummit,
        startsOnSummit,
        fullyWithinSummit
    };
}

/**
 * Precondition: The line is split by the polygon (`turf.lineSplit`).
 */
function analyzeSegment(lineStringFeature, options) {
    const type = segmentType(lineStringFeature, options.summit, options.boundaryTolerance);
    const isValidLoop = (type === "loop") && !turf.booleanWithin(lineStringFeature, options.multiSummitBoundary);
    const isInvalidLoop = (type === "loop") && !isValidLoop;
    const isValidSummit = (type === "start") || isValidLoop;

    return {
        segment: lineStringFeature,
        type,
        isValidLoop,
        isInvalidLoop,
        isValidSummit
    };
}

/**
 * Precondition: The line is split by the polygon (`turf.lineSplit`).
 */
function segmentType(lineStringFeature, polygonFeature, tolerance) {
    const isWithin = util.isInnerSegmentWithin(lineStringFeature, polygonFeature);
    const isStartOnBoundary = util.isCoordinateOnPolygonBoundary(util.start(lineStringFeature), polygonFeature, tolerance);
    const isEndOnBoundary = util.isCoordinateOnPolygonBoundary(util.end(lineStringFeature), polygonFeature, tolerance);

    if (!isWithin && !isStartOnBoundary && isEndOnBoundary) return "start";
    if (!isWithin && isStartOnBoundary && !isEndOnBoundary) return "end";
    if (!isWithin && isStartOnBoundary && isEndOnBoundary) return "loop";
    if (isWithin && isStartOnBoundary && isEndOnBoundary) return "inner";

    return null;
}

module.exports = {
    analyzeActivities,
    analyzeActivity,
    analyzeSegment
};