var statuses = require('./statuses.json');
var prettyjson = require('prettyjson');
var fs = require('fs');

var RTId = 825040832248107009;

var filterFunction = function(tweet) {
  return tweet.retweeted_status
    && tweet.retweeted_status.id
    &&tweet.retweeted_status.id === 825040832248107009;
};

console.log('statuses', statuses.length);

var finalStatuses = statuses.filter(filterFunction);

console.log('final', finalStatuses.length);

fs.writeFileSync('./final-statuses.json', JSON.stringify(finalStatuses));


var onlyNames = finalStatuses.map(function(retweet) { return { 'name': retweet.user.name, 'username': retweet.user.screen_name}; });
console.log(prettyjson.render(onlyNames, finalStatuses));
