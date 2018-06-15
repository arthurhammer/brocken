const got = require("got");

async function getAllActivityIds(access_token) {
    return (await getAllActivities(access_token))
        .map(activity => activity.id);
}

async function getAllActivities(access_token) {
    const activities = [];
    let pagedActivities = [];
    let page = 1;

    do {
        pagedActivities = await getActivities(access_token, page++);
        activities.push(...pagedActivities);
    } while (pagedActivities.length > 0);

    return activities;
}

async function getActivities(access_token, page=1, per_page=200) {
    const url = "https://www.strava.com/api/v3/athlete/activities";

    const options = {
        json: true,
        query: { access_token, page, per_page }
    };

    return (await got(url, options)).body;
}

async function getDetailActivity(access_token, id) {
    const url = `https://www.strava.com/api/v3/activities/${id}`;

    const options = {
        json: true,
        query: { access_token }
    };

    return (await got(url, options)).body;
}

module.exports = {
    getAllActivities,
    getAllActivityIds,
    getDetailActivity
};