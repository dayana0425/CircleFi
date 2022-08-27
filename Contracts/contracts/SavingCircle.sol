// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Modifiers.sol";
import "./Escrow.sol";

contract SavingCircle is Modifiers, VRFConsumerBase {
    using SafeMath for uint256;
    
    // Stages Of The Saving Circle 
    enum Stages {
        Setup, // setting up the saving circle (where participants can register & we collect deposits)
        Save, // saving stage is when the rounds have begun & participants can contribute money
        Finished, // the saving circle successfully completed
        Emergency // the saving circle failed to complete
    }

    // Stage modifier
    modifier atStage(Stages _stage) {
        require(stage == _stage, "Incorrect Stage");
        _;
    }

    // Information for each participant
    struct Participant {
        address userAddr; // User's address
        uint256 depositFee; // Deposit fee that the user paid
        bool isActive; // Defines if the user is participating in the current saving circle
        uint256 amountPaid; // What they paid so far for the current round
        bool fullyPaid; // If user paid the full amount for the current round
        Escrow escrow;
    }

    // Saving Circle Setup Variables
    uint256 public saveAmount; // Payment on each round/cycle
    uint256 public depositFee; // The deposit fee the host will charge to the participants to be payed as commitment at the begining of the saving circle
    uint256 public groupSize; // Number of slots for users to participate on the saving circle
    uint256 public payTime = 0; // How many days users have to pay per round
    address public host; // The user that deploy the contract is the administrator / host

    // Saving Circle Participants Variables
    mapping(address => Participant) public participants; // participants account address maps to their data
    address[] participantAddresses; // stores all participants addresses
    address[] possibleWinnerAddresses; // keeps track of who is available to win during each round

    // Counters and Flags for Saving Circle
    uint256 public participantCounter = 0; // Keeps track of how many participants are registered
    uint256 public totalDepositFeesSum = 0; // Keeps track of all deposits collected
    Stages public stage; // Stage that the saving circle is at

    // Counters and flags for rounds - must be reinitialized/changed once a new round begins
    uint256 public paidCounter = 0; // Participants that fully paid for the current round
    uint8 public round = 1; // Current round
    uint256 public startTime; // Start time of round

    // Chainlink vrf variablestotalDepositsSum
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
    event SavingCircleEstablished(uint256 saveAmount, uint256 groupSize);
    event RegisterUser(address user);
    event PaidDeposit(address user, bool success);
    event PaidRound(address user, bool success);
    event PartiallyPaidRound(address user, bool success);
    event StartedFirstRound(uint256 startTime);
    event EveryonePaid(address savingCircle, bool success);
    event RoundEndedAndUserWasPaidOut(address user, bool success); 
    event AllRoundsCompleted(address savingCircle, bool success);
    event CompleteCircle(address roundAddress, uint256 startAt, uint256 endAt);
    event EmergencyWithdrawal(address roundAddress, uint totalFunds, address participantAddress, uint256 sentFunds);

    /* 
        Constructor 
    */
    constructor (uint256 _saveAmountPerRound, uint256 _groupSize, uint256 _payTime, address _host) 
    VRFConsumerBase (vrf_cordinator_goerli, link_token_addr_goerli) payable {
        require(_host != address(0), "Host's address cannot be zero");
        require(_groupSize > 1 && _groupSize <= 12, "_groupSize must be greater than 1 and less than or equal to 12");
        require((_saveAmountPerRound * 1 ether) >= 0.001 ether, "Saving Amount cannot be less than 0.001 ETH");
        require(_payTime >= 1, "Pay Time cannot be less than a day.");
        // saving circle setup
        saveAmount = _saveAmountPerRound;
        depositFee = _saveAmountPerRound;
        groupSize = _groupSize;
        payTime = _payTime;
        host = _host;
        stage = Stages.Setup;

        // register host as participant
        participantCounter++;
        participantAddresses.push(msg.sender);
        possibleWinnerAddresses.push(msg.sender);

        // escrow 
        Escrow escrow = new Escrow(host, msg.sender, depositFee);
        participants[msg.sender] = Participant(msg.sender, msg.value, false, 0, false, escrow);
        totalDepositFeesSum += depositFee;

        emit PaidDeposit(msg.sender, true);
        emit RegisterUser(msg.sender);
        emit SavingCircleEstablished(saveAmount, groupSize);
    }

    /* 
        Stage: SETUP 
    */
    function registerToSavingCircle() external payable atStage(Stages.Setup) {
        require(!participants[msg.sender].isActive, "You are already registered.");
        require(participantCounter < groupSize, "The current saving circle is full.");
        require(msg.value == depositFee, "NOT ENOUGH");

        participantCounter++; // keeping track of circle participants
        participantAddresses.push(msg.sender);
        possibleWinnerAddresses.push(msg.sender);
        
        // escrow
        Escrow escrow = new Escrow(host, msg.sender, depositFee);

        participants[msg.sender] = Participant(msg.sender, msg.value, false, 0, false, escrow); // user address, deposit fee, savings amount, active in circle, amount paid *SO FAR* for round, if they fully paid
        totalDepositFeesSum += depositFee; // keeping track of all deposits paid so far

        emit PaidDeposit(msg.sender, true);
        emit RegisterUser(msg.sender);
    }

    function startFirstRound() external onlyHost(host) atStage(Stages.Setup) {
        require(round == 1, "This function can only be called if it's the first round.");
        require(participantCounter == groupSize, "There are still spots left. All spots must be filled in order to start the rounds.");
        stage = Stages.Save;
        startTime = block.timestamp;
        emit StartedFirstRound(startTime);
    }

    /* 
        Stage: SAVE 
    */
    function makePayment() external payable isRegistered(participants[msg.sender].isActive) atStage(Stages.Save) {
        // get payment value
        uint256 _payAmount = msg.value;
        // require that the participant hasn't fully paid yet
        require(participants[msg.sender].fullyPaid == false, "You already paid for this round. Wait until next round starts.");
        // require that the round has started
        require(block.timestamp >= startTime, "Round has not started yet! Wait for host to start the round.");
        // require that incoming payment for round is less than or equal than what they owe
        require(_payAmount <= (saveAmount - participants[msg.sender].amountPaid) && _payAmount > 0 , "Incorrect Payment.");

        // sum incoming amount with past payments to check whether they have completely paid or not
        uint256 sum  = participants[msg.sender].amountPaid + _payAmount;
        // if user is completing full payment
        if(sum == saveAmount) { 
            participants[msg.sender].fullyPaid = true;
            paidCounter++; 
            emit PaidRound(msg.sender, true);
        } // if user is making an incremental payment
        else { 
            participants[msg.sender].amountPaid += _payAmount;
            emit PartiallyPaidRound(msg.sender, true);
        }
        
        // emit event when everyone has paid
        if(paidCounter == participantCounter) {
            emit EveryonePaid(address(this), true);
        }
    }


    function endRoundAndStartNextRound() public onlyHost(host) atStage(Stages.Save) { // the host has to manually end the round and start the next one
        // require that it's before the deadline
        if(!(block.timestamp <= (startTime + (payTime * 86400)))){
            stage = Stages.Emergency;
            require(block.timestamp <= (startTime + (payTime * 86400)), "CANNOT END ROUND AFTER DEADLINE. Extend Deadline or Emergency Withdrawal.");
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

        // check if it's the final round
        if(round == participantCounter && possibleWinnerAddresses.length == 0) {
            stage = Stages.Finished;
            emit AllRoundsCompleted(address(this), true);
            return;
        }

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

    /* 
        Stage: FINISHED
    */
    function completeCircle() public onlyHost(host) atStage(Stages.Finished) { // allow host to complete & archive the circle once it's the last round 
        // require that everyone has been paid out && all rounds happened
        require(possibleWinnerAddresses.length == 0 && round == participantCounter, "Not everyone has been paid out so saving circle cannot be completed.");
        emit CompleteCircle(address(this), startTime, block.timestamp);
    }

    /* 
        Chainlink VRF Helper Functions 
    */
    function initializeRandomness() internal returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee_goerli, "Not enough LINK in contract." );
        return requestRandomness(keyHash_goerli, fee_goerli);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness.mod(possibleWinnerAddresses.length).add(1);
    }

    function getRandomWinnerAddress() internal view returns (address addr) {
        // get winner address
        addr = possibleWinnerAddresses[randomResult];
    }

    function removeWinner(uint256 index) internal {
        require(index < possibleWinnerAddresses.length, "removeWinner: Index Out of Bounds.");
        for (uint i = index; i < possibleWinnerAddresses.length-1; i++) {
            possibleWinnerAddresses[i] = possibleWinnerAddresses[i+1];
        }
        possibleWinnerAddresses.pop();
    }

    /* 
    
    Stage: EMERGENCY
    */

    // extend deadline by 7 days for round so participants have more time to pay
    function extendDeadline() public onlyHost(host) atStage(Stages.Emergency) {
        payTime += 7;
    }

    // uninvests money & splits all collected money to return to all participants expect participant that didn't pay. Ends Circle.
    function emergencyWithdrawal() public onlyHost(host) atStage(Stages.Emergency) { 
        // require that there are funds available to pay out 
        require(address(this).balance > 0, "No funds to distribute."); 

        address[] memory paid; // keep track of who has paid
        for (uint8 i = 0; i < participantCounter; i++) {
            if(participants[participantAddresses[i]].fullyPaid){
                paid[i] = (participantAddresses[i]);
            }
        }

        // only pay those who have been paying
        for (uint8 i = 0; i < paid.length; i++) {
            (bool sent,) = paid[i].call{value: (address(this).balance / paid.length)}("");
            require(sent, "Failed to send Ether");
            emit EmergencyWithdrawal(address(this), address(this).balance, paid[i], (address(this).balance / paid.length));
        }
    }
}
