// Import required modules
const express = require('express');
const cron = require("cron");
import fetch from 'node-fetch';

const { twitterClient } = require("./twitterClient.js");

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Define a function to fetch data from Subscan API
async function fetchSubscanData() {
    const data = {
        "data": {
            "confirm_total": 0,
            "referendum_locked": 0,
            "referendum_participate": 0,
            "voting_total": 0
        },
        "generated_at": 1699600641,
        "message": "Success"
    };

    try {
        const response = await fetch("https://polkadot.api.subscan.io/api/scan/referenda/statistics", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Subscan data: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching Subscan data:', error);
        throw error;
    }
}

// Define a function to fetch DOT price from Coingecko API
async function fetchDotPrice() {
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=Polkadot&vs_currencies=USD");
        if (!response.ok) {
            throw new Error(`Failed to fetch DOT price from Coingecko: ${response.statusText}`);
        }

        const data = await response.json();
        return data.polkadot.usd;
    } catch (error) {
        console.error('Error fetching DOT price from Coingecko:', error);
        throw error;
    }
}

// Define a function to post tweets
async function postTweet(tweetData) {
    try {
        await twitterClient.v2.tweet(tweetData);
        console.log("Tweet posted successfully");
    } catch (error) {
        console.error('Error posting tweet:', error);
        throw error;
    }
}

// Define a function to handle OpenGov tracks
async function openGovTracks() {
    try {
        const [subscanData, dotPrice] = await Promise.all([fetchSubscanData(), fetchDotPrice()]);

        const referendum_locked = Math.floor(subscanData.data.referendum_locked / 10000000000);
        const formattedReferendumLocked = referendum_locked.toLocaleString();
        const referendumLockedUsd = (referendum_locked * dotPrice).toLocaleString();
        const formattedReferendumParticipates = Math.floor(subscanData.data.referendum_participate / 10000000000000);
        const referendumParticipate = formattedReferendumParticipates.toLocaleString();
        const votingTotal = subscanData.data.voting_total;
        const confirmTotal = subscanData.data.confirm_total;
        const nextBurn = (referendum_locked / 100).toLocaleString();
        const nextBurnUsd = ((referendum_locked / 100) * dotPrice).toLocaleString();

        const tweetData = `OpenGov Treasury Overview \n Available ${formattedReferendumLocked} DOT ($${referendumLockedUsd} USD) \n Next Burn ${nextBurn} DOT ($${nextBurnUsd} USD) \n DOT Price $${dotPrice} USD \n Active Voters ${referendumParticipate} \n Active Referendums ${votingTotal} \n Confirming Referendums ${confirmTotal} \n\n #DOT #POLKADOT #OpenGOV #votes`;

        await postTweet(tweetData);
    } catch (error) {
        console.error('Error in OpenGovTracks:', error);
        throw error;
    }
}

// Schedule the OpenGovTracks function to run at regular intervals using Cron
openGovTracks()

// Export the Express app (optional)
module.exports = app;
