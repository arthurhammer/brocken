const turf = require("@turf/turf");
const util = require("./util");

const brockenPeak = [10.615571, 51.799141];
const brocken = turf.circle(brockenPeak, 0.35);  // in km
const multiSummitBoundary = turf.circle(brockenPeak, 3);  // in km
const boundaryTolerance = 0.00001; // in km

function analyzeActivities(activityFeatures) {
    return activityFeatures.map(analyzeActivity);
}

function analyzeActivity(activityFeature) {
    const isEmpty = turf.coordAll(activityFeature).length < 2;  // empty := less than two coordinates
    const endsOnBrocken = isEmpty ? false : util.endsIn(activityFeature, brocken);
    const startsOnBrocken = isEmpty ? false : util.startsIn(activityFeature, brocken);
    const fullyWithinBrocken = isEmpty ? false : turf.booleanWithin(activityFeature, brocken);
    
    const segments = isEmpty 
        ? [] 
        : turf.lineSplit(activityFeature, brocken).features.map(analyzeSegment);

    const summits = util.sum(segments, s => s.isValidSummit ? 1 : 0);
    
    return { 
        activity: activityFeature, 
        segments, 
        summits, 
        isEmpty, 
        endsOnBrocken, 
        startsOnBrocken, 
        fullyWithinBrocken 
    };
}

/**
 * Precondition: The line is split by the polygon (`turf.lineSplit`). 
 */
function analyzeSegment(lineStringFeature) {
    const type = util.segmentType(lineStringFeature, brocken, boundaryTolerance);
    const isValidLoop = (type === "loop") && !turf.booleanWithin(lineStringFeature, multiSummitBoundary);
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

module.exports = {
    analyzeActivities,
    analyzeActivity,
    analyzeSegment
};