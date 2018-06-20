const turf = require("@turf/turf");
const util = require("./util");

function analyzeActivities(activityFeatures, options) {
    return activityFeatures.map(a => analyzeActivity(a, options));
}

function analyzeActivity(activityFeature, options) {
    const summit = options.summit;

    const isEmpty = turf.coordAll(activityFeature).length < 2;  // empty := less than two coordinates
    const endsOnSummit = isEmpty ? false : util.endsIn(activityFeature, summit);
    const startsOnSummit = isEmpty ? false : util.startsIn(activityFeature, summit);
    const fullyWithinSummit = isEmpty ? false : turf.booleanWithin(activityFeature, summit);

    const segments = isEmpty
        ? []
        : turf.lineSplit(activityFeature, summit).features.map(s => analyzeSegment(s, options));

    const summits = util.sum(segments, s => s.isValidSummit ? 1 : 0);

    return {
        activity: activityFeature,
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