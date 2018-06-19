const fs = require("fs");
const brocken = require("./src/brocken");
const util = require("./src/util");
const argv = process.argv.slice(2);

function info(results) {
    // --- Main ---
    const summits = util.sum(results, r => r.summits);
    const activitiesWithValidSummits = results.filter(r => r.summits > 0);
    const maxSummitsInAnActivity = Math.max(...results.map(r => r.summits));

    console.log(`${summits} valid summits in ${activitiesWithValidSummits.length} activities`);
    console.log("Maximum number of summits in a single activity:", maxSummitsInAnActivity);

    // --- Info ---
    const emptyActivities = results.filter(r => r.isEmpty);
    const brockenActivities = results.filter(r => (r.summits > 0) || (r.startsOnBrocken));  
    const activitiesEndingOnBrocken = results.filter(r => r.endsOnBrocken);
    const activitiesStartingOnBrocken = results.filter(r => r.startsOnBrocken);
    const activitiesFullyWithinBrocken = results.filter(r => r.fullyWithinBrocken);
    const activitiesWithMultipleSummits = results.filter(r => r.summits > 1);
    const activitiesWithInvalidMultipleSummits = results.filter(
        r => r.segments.some(s => s.isInvalidLoop)
    );

    const resultActivities = results => results.map(r => r.activity);
    const summarize = results => util.summarizeActivityTypes(resultActivities(results));

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
}

if (argv.length != 1) {
    console.error("Usage: index.js <geojson-file>");
    process.exit(1);
}

const activitiesPath = argv[0];
const activityFeatures = JSON.parse(fs.readFileSync(activitiesPath)).features;
const results = brocken.analyzeActivities(activityFeatures);

info(results);