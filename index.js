require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js")
const { ApiPromise, WsProvider } = require('@polkadot/api')
const CronJob = require("cron").CronJob;
const express = require('express')
const app = express()
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const subscan = async () => {
    const data = {
      "origin": "string",
      "page": 0,
      "row": 10,
      "status": "active"
    };
    const API_KEY = process.env.SUBSCAN_API_KEY;
  
    try {
      const response = await fetch("https://polkadot.api.subscan.io/api/scan/referenda/referendums", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(data)
      });
  
      const responseData = await response.json();
      const referendumIndexes = responseData.data.list.map(item => item.referendum_index);
  
      // Call polkassembly with each referendum_index
      for (const postId of referendumIndexes) {
        await polkassembly(postId);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const polkassembly = async (postId) => {
 
    const data = {
      postId: postId,
      page: 1,
      listingLimit: Infinity,
      voteType: 'ReferendumV2'
    };
  
    const url = `https://api.polkassembly.io/api/v1/votes?postId=${data.postId}&page=${data.page}&listingLimit=${data.listingLimit}&voteType=${data.voteType}`;
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-network': 'polkadot'
        },
        body: JSON.stringify(data)
      });
  
// ... (your existing code)

let abstain, nay, aye;

try {
    const responseData = await response.json();
    
    if (responseData.abstain && responseData.no && responseData.yes) {
        abstain = (responseData.abstain.votes || []).map((abstain) => ({
            decision: abstain.decision,
            createdAt: abstain.createdAt,
            voter: abstain.voter,
            balance: abstain.balance.abstain,
            lockPeriod: abstain.lockPeriod
        }));

        nay = (responseData.no.votes || []).map((nay) => ({
            decision: nay.decision,
            createdAt: nay.createdAt,
            voter: nay.voter,
            balance: nay.balance.value,
            lockPeriod: nay.lockPeriod
        }));

        aye = (responseData.yes.votes || []).map((aye) => ({
            decision: aye.decision,
            createdAt: aye.createdAt,
            voter: aye.voter,
            balance: aye.balance.value,
            lockPeriod: aye.lockPeriod
        }));
    }

    //... (rest of your code)

} catch (error) {
    console.error('Error:', error);
}

      //console.log(abstain)
      const timestampArrayAbstain = abstain.map((vote) => {
        const timestamp = new Date(vote.createdAt).getTime();
        return timestamp;
    });
    
    const timestampArrayNay = nay.map((vote) => {
        const timestamp = new Date(vote.createdAt).getTime();
        return timestamp;
    });
    
    const timestampArrayAye = aye.map((vote) => {
        const timestamp = new Date(vote.createdAt).getTime();
        return timestamp;
    });
    
    console.log("Abstain Timestamp Array:", timestampArrayAbstain);
    console.log("Nay Timestamp Array:", timestampArrayNay);
    console.log("Aye Timestamp Array:", timestampArrayAye);
    
const wsProvider = new WsProvider('wss://rpc.polkadot.io');
const api = await ApiPromise.create({ provider: wsProvider });

const timestamps = Number((await api.query.timestamp.now()).toString());

console.log(timestamps);


     // Define a tolerance in milliseconds for timestamp matching
     const timestampTolerance = 300000; // 5 minutes in milliseconds

    
const matchingVotesAbstain = abstain.filter(vote => {
    const timestamp = new Date(vote.createdAt).getTime();
    return Math.abs(timestamp - timestamps) <= timestampTolerance;
});

const matchingVotesNay = nay.filter(vote => {
    const timestamp = new Date(vote.createdAt).getTime();
    return Math.abs(timestamp - timestamps) <= timestampTolerance;
});

const matchingVotesAye = aye.filter(vote => {
    const timestamp = new Date(vote.createdAt).getTime();
    return Math.abs(timestamp - timestamps) <= timestampTolerance;
});

    
    
    const processMatchingVotes = async(matchingVotes, voteType) => {
        if (matchingVotes.length > 0) {
            const voters = matchingVotes.map(vote => vote.voter);
            const decision = matchingVotes.map((vote) => {
                if (vote.decision.toLowerCase() === 'yes') {
                    return 'aye 👍';
                } else if (vote.decision.toLowerCase() === 'no') {
                    return 'nay 👎';
                } else {
                    return 'abstain 🤐';
                }
            }); 
            const identities = await Promise.all(voters.map(async (voter) => {
                try {
                    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
                    const api = await ApiPromise.create({ provider: wsProvider });
                    const identity = await api.query.identity.identityOf(voter);
                    if (identity.toPrimitive().info.display.raw.startsWith('0x')) {
                        const emojiIdentityHex = identity.toPrimitive().info.display.raw;
                        
                        // Remove the '0x' prefix
                        const emojiIdentityWithoutPrefix = emojiIdentityHex.slice(2);
                    
                        // Convert hex to UTF-8
                        const emojiIdentityUTF8 = Buffer.from(emojiIdentityWithoutPrefix, 'hex').toString('utf-8');
                    
                        return emojiIdentityUTF8;
                    }
                    return identity.toPrimitive().info.display.raw
                    
                } catch (error) {
                    try {
                    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
                    const api = await ApiPromise.create({ provider: wsProvider });
                    const identity = await api.query.identity.superOf(voter);
                    const render = identity.toJSON()
                    const raw = render[1].raw
                    const rawIdentity = raw.slice(2);
                    const rawString = Buffer.from(rawIdentity, 'hex').toString('utf-8');
                    return rawString
                    }
                     catch (error) {
                        return "Someone"
                    }
                }
            }));

            const twitter = await Promise.all(voters.map(async (voter) => {
                try {
                    const wsProvider = new WsProvider('wss://polkadot.api.onfinality.io/ws?apikey=023fc078-a5b7-4a72-81c4-40e118b6097b');
                    const api = await ApiPromise.create({ provider: wsProvider });
                    const identity = await api.query.identity.identityOf(voter);
                    if (identity && identity.toPrimitive() && identity.toPrimitive().info && identity.toPrimitive().info.twitter && identity.toPrimitive().info.twitter.raw) {
                        const twitterIdentity = identity.toPrimitive().info.twitter.raw || "";
                        return twitterIdentity;
                    } else {
                        return "";
                    }
                } catch (error) {
                    console.error(`Error fetching identity for ${voter}:`, error);
                    return "";
                }
            }));
            const lockPeriod = matchingVotes.map(vote => {
              if (vote.lockPeriod === 0 || vote.lockPeriod === null) {
                  return 0.1;
              } else {
                  return vote.lockPeriod;
              }
          });          
            const balanceDot = matchingVotes.map(vote => vote.balance / 10000000000);
            const TotalDOT = Math.floor(balanceDot)
            const formattedTotalDOT = TotalDOT.toLocaleString();
            const effectiveVotes = (balanceDot * lockPeriod).toLocaleString();
            const referendumLink = `https://polkadot.polkassembly.io/referenda/${postId}`
            const tweetData = `${identities.join(', ')} ${twitter} voted ${decision} with ${formattedTotalDOT} DOT with a total effective votes of ${effectiveVotes} DOT and ${lockPeriod}x conviction on Referendum ${postId} ${referendumLink}\n\n#DOT #POLKADOT #OpenGOV #votes`;
            const tweet = async () => {
                try {
                    await twitterClient.v2.tweet(tweetData);
                } catch (e) {
                    console.log(e);
                }
            };
            console.log(voters);
            console.log(decision);
            console.log(formattedTotalDOT);
            console.log(effectiveVotes)
            console.log(lockPeriod);
            console.log(postId)
            console.log(identities.join(', '))
            console.log(twitter)
                    if (effectiveVotes > 500) {
                        await tweet(); // Assuming tweet is previously defined as an async function
                        console.log("Tweet sent because effectiveVotes is greater than 500.");
                    } else {
                        console.log("No tweet was sent because effectiveVotes is 500 or less.");
                    }
        } else {
            console.log(`${voteType} failed`);
        }
    };
    
    processMatchingVotes(matchingVotesAbstain, 'Abstain');
    processMatchingVotes(matchingVotesNay, 'Nay');
    processMatchingVotes(matchingVotesAye, 'Aye');


   

    } catch (error) {
      console.error('Error:', error);
    }

//      const tweet = async () => {
//    try {
//      await twitterClient.v2.tweet("here");
//    } catch (e) {
//      console.log(e)
//    }
//     }

//     tweet();
  };
  subscan()
  polkassembly()
//   const pollingJob = new CronJob("0 */5 * * * *", async () => {
//     console.log("Checking for new votes...");
//     await subscan();
//     await polkassembly();
// });

// // Start the CronJob
// pollingJob.start();


//   const pollingInterval = 600000; // 1 minute
//   setInterval(async () => {
//       console.log("Checking for new votes...");
//       await polkassembly(); // Make sure to await the function
//   }, pollingInterval);

