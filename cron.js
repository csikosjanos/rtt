// Importing the 3rd party libs
var fs = require('fs');
var winston = require('winston');
var Twitter = require('twitter-node-client').Twitter;

// Reading the config file
var config = require('./config.json');

// Creating instances of 3rd party libs
var twitter = new Twitter(config.twitterApiAuth);

// Utility functions

// Touch a file
var touch = function(filePath) {
  fs.closeSync(fs.openSync(filePath, 'w'));
};

// Twitter functions

var getNumberOfReTweets = function(tweetId) {
  var p = new Promise(function(pResolve, pReject) {
    var getTweetPromise = new Promise(function(gtpResolve, gtpReject) {

      winston.info('Getting the number of RTs');

      twitter.getTweet({ id: tweetId }, error(gtpReject), success(gtpResolve));
    });

    getTweetPromise
      .then(function(tweet) {
        if (tweet && typeof tweet.retweet_count !== 'undefined') {
          pResolve(tweet.retweet_count);
        } else {
          p.resolve(0);
        }
      })
      .catch(function(err, response, body) {
        pReject(err);
      });
  });
  return p;
};

var getReTweetsOfATweet = function(tweetId) {
  var p = new Promise(function(pResolve, pReject) {

    winston.info('Getting the RTs of tweet');

    var getRetweetsOfAPostURL = twitter.baseUrl + '/statuses/retweets/' + tweetId + '.json?count=100';
    twitter.doRequest(getRetweetsOfAPostURL, error(pReject), success(pResolve));
    return p;
  });
};

var error = function(pReject) {
  return function(err, response, body) {
    winston.error('Twitter Request Errror', { 'err': err });
    pReject(err);
  };
};

var success = function(pResolve) {
  return function(data) {
    var twData = JSON.parse(data);
    winston.info('Twitter Request Success');
    pResolve(twData);
  };
};

var finishWithError = function(lockFile, reason) {
  fs.unlinkSync(lockFile);
  winston.error(reason);
};


winston.info('Cron script started. Checking ' + config.tweets.length + ' tweets for new RTs.');

// Do for each tweet in the config file
config.tweets.forEach(function (tweet) {

  var now = (new Date).toJSON();

  // If we still tracking
  if (now <= tweet.finishTrackingAt) {

    winston.info('Start processing: ' + tweet.tweetId);

    // Tweet Folder path
    var tweetFolder = './' + tweet.tweetId;
    // Tweet lock file exists if the tweet fetching is progress at the moment
    var lockFile = tweetFolder + '/.lock';
    // Tweet finished file exists if the tweet already finished tracking
    var finishedFile = tweetFolder + '/.finished';
    // ReTweets file represents the amount of the tweets when last checked
    var rtsFile = tweetFolder + '/.rts';
    // Prefix for the filename that the retweets going to be saved;
    var twtsFileNamePrefix = tweetFolder + 'retweets.';

    // If the tweet foler is not exists
    if (!fs.existsSync(tweetFolder)) {

      winston.info('Never processed ... folder is created: ' + tweetFolder);
      // Creates the tweet folder
      fs.mkdirSync(tweetFolder);
      // Creates the retweets file with initial 0 value
      fs.writeFileSync(rtsFile, '0');
    }

    // Start processing if it is not in progress
    if (!fs.existsSync(lockFile)) {

      // Create .lock file for the tweet
      touch(lockFile);
      // Get old amount of retweets
      var oldRTs = parseInt(fs.readFileSync(rtsFile), 10);

      // Get the actual number of retweets
      getNumberOfReTweets(tweet.tweetId)
        .then(function(newRTs) {

          // If there are new retweets
          if (parseInt(newRTs, 10) !== oldRTs) {

            winston.log('We have few new RTs (' + newRTs + ') comparing to last time (' + oldRTs + ')');

            // Get the retweets
            getReTweetsOfATweet(tweet.tweetId)
              .then(function(reTweets){

                //update the rtsfile
                fs.writeFileSync(rtsFile, newRTs);

                //save the new retweets
                var twtsFileName = twtsFileNamePrefix + now.replace(/-|:|T|Z|\./gi, '') + '.json';
                fs.writeFileSync(twtsFileName, reTweets);

                //log success
                winston.info('New JSON successfully saved with ' + newRTs + ' RTs in ' + twtsFileName);

                //remove lockfile
                fs.unlinkSync(lockFile);
              })
              .catch(finishWithError(lockFile, 'Tried to get the retweets for: ' + tweet.tweetId));
          } else {

            winston.log('We have now same amount (' + newRTs + ') of RTs as last time (' + oldRTs + ')');
          }
        })
        .catch(finishWithError(lockFile, 'Tried to get the number of retweets for: ' + tweet.tweetId));
    } else {

      winston.error('Still locked');
    }
  } else {

    winston.info('Tweet ' + tweet.tweetId + ' has finished tracking since: ' + tweet.finishTrackingAt);
  }
});