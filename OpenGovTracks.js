require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js")
const CronJob = require("cron").CronJob;
const express = require('express')
const app = express()
const port = process.env.PORT || 4000;


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })


const OpenGovTracks = async() => {
    const data = {
        "data": {
            "confirm_total": 0,
            "referendum_locked": 0,
            "referendum_participate": 0,
            "voting_total": 0
        },
        "generated_at": 1699600641,
        "message": "Success"
    }
    
      try {
        const response = await fetch("https://polkadot.api.subscan.io/api/scan/referenda/statistics", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(data)
        });
        try {
            const getresponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=Polkadot&vs_currencies=USD", {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
            });
        
            const Data = await getresponse.json();
            const dotPrice = Data.polkadot.usd
            console.log(dotPrice)
    
        const responseData = await response.json();
        const referendum_locked = Math.floor(responseData.data.referendum_locked / 10000000000)
        const formattedreferendum_locked = referendum_locked.toLocaleString();
        const referendum_lockedusd = (referendum_locked * dotPrice).toLocaleString()
        const formattedReferendumParticipates = Math.floor(responseData.data.referendum_participate / 10000000000)
        const referendum_participate = formattedReferendumParticipates.toLocaleString()
        const voting_total = responseData.data.voting_total
        const confirm_total = responseData.data.confirm_total
        const next_burn = (referendum_locked / 100).toLocaleString()
        const next_burn_usd = ((referendum_locked / 100) * dotPrice).toLocaleString()
        console.log(next_burn, referendum_locked,referendum_participate)
        const tweetData = `OpenGov Treasury Overview \n Available ${formattedreferendum_locked} DOT ($${referendum_lockedusd} USD) \n Next Burn ${next_burn} DOT ($${next_burn_usd} USD) \n DOT Price $${dotPrice} USD \n Active Voters ${referendum_participate} \n Active Referendums ${voting_total} \n Confirming Referendums ${confirm_total} \n\n #DOT #POLKADOT #OpenGOV #votes  `
        const tweet = async () => {
            try {
              await twitterClient.v2.tweet(tweetData);
            } catch (e) {
              console.log(e)
            }
             }
         
            //  const cronTweet = new CronJob("0 0 * * 0", async () => {
            //     tweet();
            //   });
              
            //   cronTweet.start();
            tweet()
            } catch (error) {
                console.error('Error:', error);
              }
      } catch (error) {
        console.error('Error:', error);
      }
  }

  
  OpenGovTracks()
