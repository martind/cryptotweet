pragma solidity ^0.4.21;

contract CryptoTweet {
    address owner;
    bool paused;
    
    struct Tweet {
        bytes32 content;
        uint timestamp;
        address author;
    }
    
    Tweet[] public tweets;
    
    mapping (address => uint) public ownerTweetCount;
    mapping (address => address[]) public followings;
    mapping (address => address[]) public followers;
    
    event NewTweet(address indexed _from, uint _index);
    event DonationReceived(address indexed _from, uint _amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier pausable() {
        if (!paused) {
            _;
        }
    }
    
    constructor() public {
        owner = msg.sender;
        paused = false;
    }
    
    function addTweet(bytes32 _message) pausable public {
        require(_message[0] != 0);
        uint index = tweets.push(Tweet(_message, now, msg.sender));
        ownerTweetCount[msg.sender]++;
        emit NewTweet(msg.sender, index);
    }
    
    function getTweetsCount() public view returns(uint) {
        return tweets.length;
    }
    
    function follow(address _toFollow) pausable public {
        require(_toFollow != address(0));
        followings[msg.sender].push(_toFollow);
        followers[_toFollow].push(msg.sender);
    }
    
    function getFollowingsCount(address _user) public view returns(uint) {
        return followings[_user].length;
    }
    
    function getFollowersCount(address _user) public view returns(uint) {
        return followers[_user].length;
    }
    
    function setPaused(bool _paused) onlyOwner external {
        paused = _paused;
    }
    
    function transferOwnership(address _newOwner) onlyOwner external {
        require(_newOwner != address(0));
        owner = _newOwner;
    }
    
    function () payable public {
        emit DonationReceived(msg.sender, msg.value);
    }
    
    function withdrawDonations() onlyOwner external {
        owner.transfer(address(this).balance);
    }
}