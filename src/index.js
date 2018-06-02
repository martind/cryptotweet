import Web3 from 'web3';
import moment from 'moment';
import cryptoTweetAbi from './contracts/abi/cryptotweet_abi.js';

const cryptoTweetAddress = '0x7b4AC6f9cFb43e899dbCf09714F125507708E703';

let web3ws;
let cryptoTweetWS;

let web3js;
let cryptoTweet;
let userAccount;
let lastTweetCount = 0;

function setupFormHandler(event) {
  const form = document.getElementById('tweetForm');

  form.addEventListener('submit', event => {
    event.preventDefault();

    const content = document.getElementById('tweetArea').value;
    addTweet(content);
  });
}

function addTweet(message) {
  cryptoTweet.methods.addTweet(web3js.utils.toHex(message))
    .send({ from: userAccount })
    .on('receipt', receipt => {
      console.log('tx succeded!');
      document.getElementById('tweetArea').value = '';
    })
    .on('error', console.log);
}

function renderTweets(tweets) {
  const tweetsContainer = document.createDocumentFragment();

  for (const tweet of tweets) {
    const content = document.createElement('div');
    content.classList.add('tweetContent');
    content.innerHTML = web3js.utils.toAscii(tweet.content);

    const time = document.createElement('div');
    time.classList.add('tweetTime');
    const formattedTime = moment(tweet.timestamp * 1000).format('lll');
    time.innerHTML = formattedTime;

    const author = document.createElement('div');
    author.classList.add('tweetAuthor');
    author.innerHTML = tweet.author;

    const tweetDiv = document.createElement('div');
    tweetDiv.classList.add('tweet');
    tweetDiv.appendChild(author);
    tweetDiv.appendChild(content);
    tweetDiv.appendChild(time);

    tweetsContainer.appendChild(tweetDiv);
  }

  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  timeline.appendChild(tweetsContainer);
}

function getTweet(index) {
  return cryptoTweet.methods.tweets(index).call();
}

function loadLastTweets() {
  cryptoTweet.methods.getTweetsCount().call()
    .then(tweetsCount => {
      if (tweetsCount === lastTweetCount) {
        return;
      }

      lastTweetCount = tweetsCount;

      const tweetsPromises = [];
      for (let i = tweetsCount - 1, n = 0; i >= 0 && n < 10; i--, n++) {
        tweetsPromises.push(getTweet(i));
      }

      Promise.all(tweetsPromises).then(renderTweets);
    });
}

function listenToNewTweets() {
  cryptoTweetWS.events.NewTweet()
    .on('data', event => {
      const data = event.returnValues;
      console.log('event received', data);
    })
    .on('error', console.log);
}

function loadUserInfo() {
  document.getElementById('userAccount').innerHTML = userAccount;

  cryptoTweet.methods.ownerTweetCount(userAccount).call()
    .then(userTweetsCount => document.getElementById('tweetsCount').innerHTML = userTweetsCount);

  cryptoTweet.methods.getFollowingsCount(userAccount).call()
    .then(followings => document.getElementById('followingsCount').innerHTML = followings);

  cryptoTweet.methods.getFollowersCount(userAccount).call()
    .then(followers => document.getElementById('followersCount').innerHTML = followers);
}

function initApp() {
  cryptoTweet = new web3js.eth.Contract(cryptoTweetAbi, cryptoTweetAddress);
  cryptoTweetWS = new web3ws.eth.Contract(cryptoTweetAbi, cryptoTweetAddress);

  setupFormHandler();

  listenToNewTweets();

  setInterval(() => {
    web3js.eth.getAccounts()
      .then(accounts => {
        if (accounts[0] !== userAccount) {
          userAccount = accounts[0];
          loadUserInfo();
        }
      });
  }, 500);

  setInterval(loadLastTweets, 500);
}

window.addEventListener('load', () => {
  if (typeof window.web3 !== undefined) {
    web3ws = new Web3('ws://localhost:8545');
    web3js = new Web3(window.web3.currentProvider);
    console.log('web3 version:', web3js.version);
    window.web3 = web3js; // is this a good idea?

    initApp();
  } else {
    console.log('Web3 not supported! :-(');
  }
});

