// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Modifiers.sol";

contract SavingCircle is Modifiers, VRFConsumerBase { // parent contracts
    using SafeMath for uint256;
    // Stages of the saving circle 
    enum Stages {
        Setup, // setting up the saving circle (where participants can register & we collect deposits)
        Save, // saving stage is when the rounds have begun & participants can contribute money
        Finished, // the saving circle successfully completed
        Emergency // the saving circle failed to complete
    }

    // Information for each participant
    struct Participant {
        address userAddr; // User's address
        uint256 depositFee; // Deposit fee that the user paid
        bool isActive; // Defines if the user is participating in the current saving circle
        uint256 amountPaid; // What they paid so far for the current round - reinitialize when round ends
        bool fullyPaid; // If user paid the full amount for the current round - reintialize when round ends
    }

    // Saving Circle Variables
    address public host; // The user that deploy the contract is the administrator / host
    uint256 public depositFee; // The deposit fee the host will charge to the participants to be payed as commitment at the begining of the saving circle
    uint256 public saveAmount; // Payment on each round/cycle
    uint256 public groupSize; // Number of slots for users to participate on the saving circle
    uint256 public payTime = 0; // How many days users have to pay per round
    mapping(address => Participant) public participants; // participants account address maps to their data
    address[] participantAddresses; // stores all participants addresses
    address[] possibleWinnerAddresses; // keeps track of who can win during each round

    // Counters and flags for saving circle
    uint256 participantCounter = 0; // Keeps track of how many participants are registered
    uint256 public totalDepositsSum = 0; // Keeps track of all deposits collected
    Stages public stage; // Stage that the saving circle is at

    // Counters and flags for rounds - must be reinitialized/changed once a new round begins
    uint256 paidCounter = 0; // participants that paid 
    uint8 public round = 1; // Current round
    uint256 public startTime; // start time of round

    // chainlink vrf variables
    address vrf_cordinator_goerli = 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D; // from chainlink docs - ethereum testnet - address of $link token smart contract
    address vrf_cordinator_mumbai = 0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed; // from chainlink docs - polygon testnet
    address link_token_addr_goerli = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB; // from chainlink docs - ethereum testnet - address of smart contract that verifies the randomness of the number returned by chainlink
    address link_token_addr_mumbai = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB; // from chainlink docs - polygon testnet
    bytes32 internal keyHash_goerli = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15; // from chainlink docs - ethereum testnet
    bytes32 internal keyHash_mumbai = 0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f; // from chainlink docs - polygon testnet
    uint internal fee_goerli = 0.1 * 10 ** 18; // 0.1 LINK expressed in wei
    uint internal fee_mumbai = 0.1 * 10 ** 18; // 0.1 LINK expressed in wei
    uint public randomResult;  

    // Events
    event SavingCircleEstablished(uint256 indexed saveAmount, uint256 indexed groupSize);
    event RegisterUser(address indexed user);
    event PayDeposit(address indexed user, bool indexed success);
    event PayRound(address indexed user, bool indexed success);
    event ParticipantFullyPaidForRound(address indexed user, bool indexed success);
    event RoundStarted(uint256 startTime);
    event RoundEndedAndUserWasPaidOut(address indexed user, bool indexed success); 
    event CompleteCircle(address indexed roundAddress, uint256 indexed startAt, uint256 indexed endAt);
    event EmergencyWithdrawal(address roundAddress, uint totalFunds, address participantAddress, uint256 sentFunds);

    constructor (uint256 _saveAmountPerRound, uint256 _groupSize, address _host, uint256 _payTime) 
    VRFConsumerBase (vrf_cordinator_goerli, link_token_addr_goerli) {
        require(_host != address(0), "Host's address cannot be zero");
        require(_groupSize > 1 && _groupSize <= 12, "_groupSize must be greater than 1 and less than or equal to 12");
        require(_saveAmountPerRound >= 1, "Saving Amount cannot be less than 1 ETH");
        require(_payTime >= 1, "Pay Time cannot be less than a day.");

        // saving circle setup
        host = _host;
        depositFee = _saveAmountPerRound;
        saveAmount = _saveAmountPerRound;
        groupSize = _groupSize;
        payTime = _payTime;
        stage = Stages.Setup;
        
 
        // emit that saving circle has been setup
        emit SavingCircleEstablished(saveAmount, groupSize);
    }

    modifier atStage(Stages _stage) {
        require(stage == _stage, "Incorrect Stage");
        _;
    }

    function registerToSavingCircle() external payable atStage(Stages.Setup) {
        require(!participants[msg.sender].isActive, "You are already registered.");
        require(participantCounter < groupSize, "The current saving circle is full.");
        require(msg.value == depositFee, "NOT ENOUGH");

        participantCounter++; // keeping track of circle participants
        participantAddresses.push(msg.sender);
        possibleWinnerAddresses.push(msg.sender);
        participants[msg.sender] = Participant(msg.sender, msg.value, false, 0, false); // user address, deposit fee, savings amount, active in circle, amount paid *SO FAR* for round, if they fully paid
        totalDepositsSum += depositFee; // keeping track of all deposits paid so far

        emit PayDeposit(msg.sender, true);
        emit RegisterUser(msg.sender);
    }

    function startRounds() external onlyHost(host) atStage(Stages.Setup) {
        require(participantCounter == groupSize, "There are still spots left. All spots must be filled in order to start the rounds.");
        stage = Stages.Save;
        startTime = block.timestamp;
        emit RoundStarted(startTime);
    }

    function makePayment() external payable isRegisteredParticipant(participants[msg.sender].isActive) atStage(Stages.Save) {
        // get payment value
        uint256 _payAmount = msg.value;
        // require that the participant hasn't fully paid yet
        require(participants[msg.sender].fullyPaid == false, "You already paid for this round. Wait until next round starts.");
        // require that the round has started
        require(block.timestamp >= startTime, "Round has not started yet!");
        // require that incoming payment for round is less than or equal than what they owe
        require(_payAmount <= (saveAmount - participants[msg.sender].amountPaid) && _payAmount > 0 , "Incorrect Payment.");

        // sum incoming amount with past payments to check whether they have completely paid or not
        uint256 sum  = participants[msg.sender].amountPaid + _payAmount;
        // if user is completing full payment
        if(sum == saveAmount) { 
            participants[msg.sender].fullyPaid = true;
            paidCounter++; 
            emit ParticipantFullyPaidForRound(msg.sender, true);
        } // if user is making an incremental payment
        else { 
            participants[msg.sender].amountPaid += _payAmount;
            emit PayRound(msg.sender, true);
        }
    }


    function endRound() public onlyHost(host) atStage(Stages.Save) {
        // require that it's before the deadline
        if(!(block.timestamp <= (startTime + (payTime * 1 days)))){
            stage = Stages.Emergency;
            require(block.timestamp <= (startTime + (payTime * 1 days)), "CANNOT END AFTER BEFORE THE DEADLINE. Extend Deadline or Emergency Withdrawal.");
        }
        // require that all participants have paid
        for (uint8 i = 0; i < participantCounter; i++) {
            if(!participants[participantAddresses[i]].fullyPaid) { // a participant didn't fully pay
                stage = Stages.Emergency;
                require(participants[participantAddresses[i]].fullyPaid == true, "A participant didn't fully pay. Extend Deadline or Emergency Withdrawal.");
            }
        }

        // randomly pick a winner
        initializeRandomness();
        address winnerAddress = getRandomWinnerAddress();

        // send funds to winner
        (bool sent,) = winnerAddress.call{value: saveAmount}("");
        
        // remove winner from being chosen again
        if(!sent) {   
            removeWinner(randomResult);
        }

        require(sent, "Failed to send Ether");

        // increment round to next one
        round++; 
        // reset participant data for new round
        for (uint8 i = 0; i < participantCounter; i++) {
            participants[participantAddresses[i]].fullyPaid = false;
            participants[participantAddresses[i]].amountPaid = 0;   
        }
        // reinitialize round flags and counters
        paidCounter = 0; // participants that paid 
        startTime = block.timestamp; // start time of round

        emit RoundEndedAndUserWasPaidOut(winnerAddress, sent);
    }

    function initializeRandomness() internal atStage(Stages.Save) returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee_goerli, "Not enough LINK in contract." );
        return requestRandomness(keyHash_goerli, fee_goerli);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness.mod(possibleWinnerAddresses.length).add(1);
    }

    function getRandomWinnerAddress() internal atStage(Stages.Save) returns (address winnerAddress) {
        // get winner address
        address winnerAddress = possibleWinnerAddresses[randomResult];
    }

    function removeWinner(uint256 index) internal {
        require(index < possibleWinnerAddresses.length, "removeWinner: Index Out of Bounds.");
        for (uint i = index; i < possibleWinnerAddresses.length-1; i++) {
            possibleWinnerAddresses[i] = possibleWinnerAddresses[i+1];
        }
        possibleWinnerAddresses.pop();
    }

    // allow host to complete & archive the circle once it's the last round 
    function completeCircle() public onlyHost(host) atStage(Stages.Save) {
        // require that everyone has been paid out
        require(possibleWinnerAddresses.length == 0, "Not everyone has been paid out so saving circle cannot be completed.");
        // distribute rewards to everyone

        emit CompleteCircle(address(this), startTime, block.timestamp);
    }

    // extend deadline by 7 days for round so participants have more time to pay
    function extendDeadline() public onlyHost(host) atStage(Stages.Emergency) {
        payTime += 7;
    }

    // uninvests money & splits all collected money to return to all participants expect participant that didn't pay. Ends Circle.
    function emergencyWithdrawal() public onlyHost(host) atStage(Stages.Emergency) { 
        require(address(this).balance > 0, "No funds to distribute."); 
        address[] memory paid;
        for (uint8 i = 0; i < participantCounter; i++) {
            if(participants[participantAddresses[i]].fullyPaid){
                paid[i] = (participantAddresses[i]);
            }
        }
        
        for (uint8 i = 0; i < paid.length; i++) {
            (bool sent,) = paid[i].call{value: (address(this).balance / paid.length)}("");
            require(sent, "Failed to send Ether");
            emit EmergencyWithdrawal(address(this), address(this).balance, paid[i], (address(this).balance / paid.length));
        }
    }
}
