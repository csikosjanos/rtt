var fs = require('fs');
var prettyjson = require('prettyjson');
var Twitter = require('twitter-node-client').Twitter;
var config = require('./config.json');

var twitter = new Twitter(config);
var tweetId = '825040832248107009';

var jsonConf = {
  keysColor: 'blue',
  dashColor: 'yellow',
  stringColor: 'white'
};

var error = function(err, response, body) {
	console.log(JSON.stringify({ 'err': err, 'res': response, 'body': body }));
};

var success = function(data) {
	var twData = JSON.parse(data);
	console.log('success ---->');
	console.log(prettyjson.render(twData, jsonConf));
	// console.log('like count', data.favorite_count, ' retweet_count', data.retweet_count);
};

var successReTweet = function(data) {
	// console.log(data);
	var twData = JSON.parse(data);
	var onlyNames = twData.map(function(retweet) { return { 'name': retweet.user.name, 'username': retweet.user.screen_name}; });
	console.log(prettyjson.render(onlyNames, jsonConf));
};

//twitter.getTweet({ id: tweetId}, error, success);

var getRetweetsOfAPostURL = twitter.baseUrl + '/statuses/retweets/' + tweetId + '.json?count=100';
//console.log('getRetweetsOfAPostURL', getRetweetsOfAPostURL);

// twitter.doRequest(getRetweetsOfAPostURL, error, successReTweet);

var searchForTweets = function(query) {
  var statuses = [];
  var params = {
    q: query,
    count: 100
  };

  var searchSuccess = function(data) {
    var twData = JSON.parse(data);
    var resLength = twData.statuses.length;

    console.log('----');
    console.log(
      'new reqeust length', resLength,
      'all toghether length', statuses.length
    );

    if (resLength) {
      var lastMaxId = twData.statuses[resLength - 1].id;
      console.log('last max_id', lastMaxId);

      statuses = statuses.concat(twData.statuses);
      params.max_id = lastMaxId - 1;
      makeSearch(params);
    } else {
      fs.writeFileSync('./'. query .'.json', JSON.stringify(statuses));
    }
  };

  var makeSearch = function(params) {
    myParams = JSON.parse(JSON.stringify(params));
    console.log('max_id before reqeust:', myParams.max_id);
    twitter.getSearch(myParams, error, searchSuccess);
  };

  makeSearch(params);
};

searchForTweets('RT @ashleaflondon');
