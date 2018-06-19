const fs = require("fs");
const turf = require("@turf/turf");
const summits = require("./src/summits");
const util = require("./src/util");
const argv = process.argv.slice(2);

function summarize(results) {
    return util.summarizeActivityTypes(results.map(r => r.activity));
}

function info(results) {
    // --- Main ---
    const totalSummits = util.sum(results, r => r.summits);
    const validSummitActivities = results.filter(r => r.summits > 0);
    const maxSummitsInAnActivity = Math.max(...results.map(r => r.summits));

    console.log("Total valid summits:", totalSummits);
    console.log("Activities with valid summits:", validSummitActivities.length);
    console.log("", summarize(validSummitActivities), "\n");
    console.log("Maximum number of summits in a single activity:", maxSummitsInAnActivity);

    // --- Info ---
    const emptyActivities = results.filter(r => r.isEmpty);
    const activitiesEndingOnBrocken = results.filter(r => r.endsOnSummit);
    const activitiesStartingOnBrocken = results.filter(r => r.startsOnSummit);
    const activitiesFullyWithinBrocken = results.filter(r => r.fullyWithinSummit);
    const activitiesWithMultipleSummits = results.filter(r => r.summits > 1);
    const activitiesWithInvalidMultipleSummits = results.filter(
        r => r.segments.some(s => s.isInvalidLoop)
    );

    const brockenActivities = [...validSummitActivities, ...activitiesStartingOnBrocken, ...activitiesFullyWithinBrocken];  

    console.log("\n---\n");
    console.log("Total activities:", results.length);
    console.log("", summarize(results), "\n");
    console.log("Activities without coordinates:", emptyActivities.length);
    console.log("", summarize(emptyActivities), "\n");
    console.log("Activities intersecting Brocken (at least once):", brockenActivities.length);
    console.log("", summarize(brockenActivities), "\n");
    console.log("Activities with (valid) multiple summits:", activitiesWithMultipleSummits.length);
    console.log("", summarize(activitiesWithMultipleSummits), "\n");
    console.log("Activities with invalid multiple summits:", activitiesWithInvalidMultipleSummits.length);
    console.log("", summarize(activitiesWithInvalidMultipleSummits), "\n");
    console.log("Activities ending on Brocken:", activitiesEndingOnBrocken.length);
    console.log("", summarize(activitiesEndingOnBrocken), "\n");
    console.log("Activities starting on Brocken:", activitiesStartingOnBrocken.length);
    console.log("", summarize(activitiesStartingOnBrocken), "\n");
    console.log("Activities fully enclosed by Brocken:", activitiesFullyWithinBrocken.length);
    console.log("", summarize(activitiesFullyWithinBrocken), "\n");
 
    // Assumes corresponding feature property exists
    const distances = validSummitActivities.map(r => r.activity.properties.distance);
    const elevationGain = validSummitActivities.map(r => r.activity.properties.elevationGain);
    console.log("Distance (min, max, mean, in m) ", Math.min(...distances), Math.max(...distances), util.sum(distances)/distances.length);
    console.log("Elevation gain (min, max, mean, in m) ", Math.min(...elevationGain), Math.max(...elevationGain), util.sum(elevationGain)/elevationGain.length);
}

if (argv.length != 1) {
    console.error("Usage: index.js <activities-geojson-file>");
    process.exit(1);
}

const brocken = [10.615571, 51.799141];

const activitiesPath = argv[0];
const activityFeatures = JSON.parse(fs.readFileSync(activitiesPath)).features;

const results = summits.analyzeActivities(activityFeatures, {
    summit: turf.circle(brocken, 0.35),  // values in km
    multiSummitBoundary: turf.circle(brocken, 3),  
    boundaryTolerance: 0.00001 
});

info(results);