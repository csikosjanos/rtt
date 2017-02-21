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
  var p = new Promise();
  var getTweetPromise = new Promise();
  var successReTweet = function() {

  }
  twitter.doRequest(getRetweetsOfAPostURL, error(getTweetPromise), success(getTweetPromise))
    .then(function(tweet) {
      if (tweet && typeof tweet.retweet_count !== 'undefined') {
        p.resolve(tweet.retweet_count);
      } else {
        p.resolve(0);
      }
    })
    .catch(function(err, response, body) {
      p.reject(err);
    });
  return p;
};

var getReTweetsOfATweet = function(tweetId) {
  var p = new Promise();
  var getRetweetsOfAPostURL = twitter.baseUrl + '/statuses/retweets/' + tweetId + '.json?count=100';
  twitter.doRequest(getRetweetsOfAPostURL, error(p), success(p));
  return p;
};

var error = function(promise) {
  return function(err, response, body) {
    winston.log('error', 'Twitter Request Errror', { 'err': err, 'res': response, 'body': body });
    promise.reject(err);
  };
};

var success = function(promise) {
  function(data) {
    var twData = JSON.parse(data);
    console.log('success ---->');
    console.log(prettyjson.render(twData, jsonConf));
    // console.log('like count', data.favorite_count, ' retweet_count', data.retweet_count);
    promise.resolve(data);
  };
};

var finishWithError = functoin(lockFile, reason) {
  fs.unlinkSync(lockFile);
  winston.log('error', reason);
};

// Do for each tweet in the config file
config.tweets.forEach(function (tweet) {

  // If we still tracking
  if (Date.now().toJson() <= tweet.finishTrackingAt) {

    // Tweet Folder path
    var tweetFolder = './' + tweet.tweetId;
    // Tweet lock file exists if the tweet fetching is progress at the moment
    var lockFile = tweetFolder + '/.lock';
    // Tweet finished file exists if the tweet already finished tracking
    var finishedFile = tweetFolder + '/.finished';
    // ReTweets file represents the amount of the tweets when last checked
    var rtsFile = tweetFolder + '/.rts';

    // If the tweet foler is not exists
    if (!fs.existsSync(tweetFolder)) {
      // Creates the tweet folder
      fs.mkdirSync(tweetFolder);
      // Creates the retweets file with initial 0 value
      fs.writeFileSync(rtsFile, '0');
    }

    // Start processing if it is not in progress or finished
    if (!(fs.existsSync(lockFile) || fs.existsSync(finishedFile))) {

      // Create .lock file for the tweet
      touch(lockFile);
      // Get old amount of retweets
      var RTs = parseInt(fs.readFileSync(rtsFile), 10);

      // Get the actual number of retweets
      getNumberOfReTweets
        .then(function(newRTs) {

          // If there are new retweets
          if (parseInt(newRTs, 10) !== RTs) {

            // Get the retweets
            getReTweetsOfATweet(tweet.tweetId)
              .then(function(reTweets){

                //update the rtsfile
                fs.writeFileSync(rtsFile, newRTs);

                //save the new retweets
                var twtsFileName =
                //log success
                //remove lockfile
              })
              .catch(finishWithError(lockFile, 'Tried to get the retweets for: ' + tweet.tweetId));
          }
        })
        .catch(finishWithError(lockFile, 'Tried to get the number of retweets for: ' + tweet.tweetId));
    }
  }
});