// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SimpleSavingCircle is VRFConsumerBase {
    using SafeMath for uint256;

    enum Stages {
        Setup,
        Save, 
        Finished,
        Emergency
    }

    struct Participant {
        address userAddr; 
        bool isActive; 
        uint256 amountPaid; 
        bool fullyPaid;
    }

    struct StageStats{
        Stages stage; 
        uint256 roundStartTime;
        uint256 participantCounter;
        uint256 paidCounter;
        uint256 paidDepositCounter;
        uint256 roundCounter;
        bool paidOut;
        bool everyonePaidDeposit;
    }

    struct CreateCircle {
        bytes32 circleId;
        string circleCid;
        address host;
        uint256 payTime;
        uint256 saveAmount;
        uint256 groupSize;
        address[] participantAddresses;
        address[] possibleWinnerAddresses; 
        StageStats stats;
    }

    mapping(bytes32 => CreateCircle) idToCircle;
    mapping(address => Participant) users;

    bytes32 public keyHash;
    uint256 public fee;
    uint256 public randomResult;

    event NewSavingCircleCreated(
        bytes32 circleId, 
        string circleCid, 
        address host, 
        uint256 payTime, 
        uint256 saveAmount, 
        uint256 groupSize, 
        address[] participantAddresses, 
        address[] possibleWinnerAddresses, 
        StageStats stats
    );
    event RegisteredNewUserAndPaidDeposit(
        bytes32 circleId, 
        address participant);
    event EveryonePaidDeposit(bytes32 circleId);
    event StartedFirstRound(bytes32 circleId, address participant);
    event PaidRound(bytes32 circleId, address participant);
    event PartiallyPaidRound(bytes32 circleId, address participant, uint256 amountPaid);
    event EveryonePaid(bytes32 circleId, uint256 amountPaid);
    event RoundEndedAndUserWasPaidOut(bytes32 circleId, address winner, bool success);
    event AllRoundsCompleted(bytes32 circleId);
    event CompleteCircle(bytes32 circleId);
    event EmergencyWithdrawal(bytes32 circleId, uint totalFunds, address participantAddress, uint256 sentFunds);

    constructor () VRFConsumerBase(0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D, 0x326C977E6efc84E512bB9C30f76E30c160eD06FB) {
        keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;
        fee = 0.1 * 10**18;
    }

    modifier atStage(bytes32 circleId, Stages _stage) {
        require(idToCircle[circleId].stats.stage == _stage, "Incorrect Stage");
        _;
    }

    modifier onlyHost(address host) {
        require(msg.sender == host, "Only the host can call this function.");
        _;
    }

    modifier isRegistered(bool user) {
        require(user == true, "User is not registered for Circle.");
        _;
    }

    function createSavingCircle (        
        uint256 _saveAmountPerRound,
        uint256 _groupSize,
        uint256 _payTime,
        string memory cid
    ) payable external {
        require(msg.sender != address(0), "Host's address cannot be zero");
        require(_groupSize > 1 && _groupSize <= 12,"_groupSize must be greater than 1 and less than or equal to 12");
        require(_saveAmountPerRound > 0, "Saving Amount cannot be less than 0 ETH");
        require(_payTime >= 1, "Pay Time cannot be less than a day.");

        bytes32 circleId = keccak256(
            abi.encodePacked(
                msg.sender,
                block.timestamp,
                _groupSize,
                _saveAmountPerRound,
                _payTime
            )
        );
        address[] memory participantAddresses;
        address[] memory possibleWinnerAddresses; 

        idToCircle[circleId] = CreateCircle(
            circleId,
            cid,
            msg.sender,
            _payTime,
            _saveAmountPerRound,
            _groupSize,
            participantAddresses,
            possibleWinnerAddresses,
            StageStats(Stages.Setup,0,1,0,msg.value,0,false,false)
        );

        idToCircle[circleId].participantAddresses.push(msg.sender);
        idToCircle[circleId].possibleWinnerAddresses.push(msg.sender);
        users[msg.sender] = Participant(msg.sender, true, 0, false);

        emit RegisteredNewUserAndPaidDeposit(circleId, msg.sender);
        emit NewSavingCircleCreated(            
            circleId,
            cid,
            msg.sender,
            _payTime,
            _saveAmountPerRound,
            _groupSize,
            participantAddresses,
            possibleWinnerAddresses,
            StageStats(Stages.Setup,0,1,0,msg.value,0,false,false)        
        );
    }

    /* 
        Stage: SETUP 
    */
    function registerToSavingCircle(bytes32 circleId) external payable atStage(circleId, Stages.Setup) {
        require(!users[msg.sender].isActive, "You are already registered.");
        require(idToCircle[circleId].stats.participantCounter < idToCircle[circleId].groupSize, "The current saving circle is full.");
        require(msg.value == idToCircle[circleId].saveAmount, "NOT ENOUGH");
        idToCircle[circleId].stats.participantCounter++;
        idToCircle[circleId].stats.paidDepositCounter += msg.value;
        idToCircle[circleId].participantAddresses.push(msg.sender);
        idToCircle[circleId].possibleWinnerAddresses.push(msg.sender);
        users[msg.sender] = Participant(msg.sender, true, 0, false);
        emit RegisteredNewUserAndPaidDeposit(circleId, msg.sender);
        if(idToCircle[circleId].stats.participantCounter == idToCircle[circleId].groupSize){ 
            idToCircle[circleId].stats.everyonePaidDeposit = true;
            emit EveryonePaidDeposit(circleId);
        }
    }

    function startFirstRound(bytes32 circleId) external onlyHost(idToCircle[circleId].host) atStage(circleId, Stages.Setup) {
        require(idToCircle[circleId].stats.roundCounter == 0, "This function can only be called if rounds haven't started yet.");
        require(idToCircle[circleId].stats.participantCounter == idToCircle[circleId].groupSize,"There are still spots left. All spots must be filled in order to start the rounds.");
        idToCircle[circleId].stats.stage = Stages.Save;
        idToCircle[circleId].stats.roundCounter = 1;
        idToCircle[circleId].stats.roundStartTime = block.timestamp; 
        emit StartedFirstRound(circleId, msg.sender);
    }

    /* 
        Stage: SAVE 
    */
    function makePayment(bytes32 circleId)
        external
        payable
        isRegistered(users[msg.sender].isActive)
        atStage(circleId, Stages.Save)
    {
        uint256 _payAmount = msg.value;
        require(users[msg.sender].fullyPaid == false, "You already paid for this round. Wait until next round starts.");
        require(block.timestamp >= idToCircle[circleId].stats.roundStartTime, "Round has not started yet! Wait for host to start the round.");
        require(_payAmount <= (idToCircle[circleId].saveAmount - users[msg.sender].amountPaid) && _payAmount > 0, "Incorrect Payment.");
        uint256 sum = users[msg.sender].amountPaid + _payAmount;

        if (sum == idToCircle[circleId].saveAmount) {
            users[msg.sender].fullyPaid = true;
            idToCircle[circleId].stats.paidCounter++;
            emit PaidRound(circleId, msg.sender);
        }
        else {
            users[msg.sender].amountPaid += _payAmount;
            emit PartiallyPaidRound(circleId, msg.sender, _payAmount);
        }

        if (idToCircle[circleId].stats.paidCounter == idToCircle[circleId].stats.participantCounter) {
            emit EveryonePaid(circleId, address(this).balance);
        }
    }

    function endRoundAndStartNextRound(bytes32 circleId)
        public
        onlyHost(idToCircle[circleId].host) 
        atStage(circleId, Stages.Save) 
    {
        if (!(block.timestamp <= (idToCircle[circleId].stats.roundStartTime + (idToCircle[circleId].payTime * 86400)))) {
            idToCircle[circleId].stats.stage = Stages.Emergency;
            require((block.timestamp <= (idToCircle[circleId].stats.roundStartTime + (idToCircle[circleId].payTime * 86400))), "CANNOT END ROUND AFTER DEADLINE. Extend Deadline or Emergency Withdrawal.");
        }

        for (uint8 i = 0; i < idToCircle[circleId].stats.participantCounter; i++) {
            if (!users[idToCircle[circleId].participantAddresses[i]].fullyPaid) {
                // a participant didn't fully pay
                idToCircle[circleId].stats.stage = Stages.Emergency;
                require(users[idToCircle[circleId].participantAddresses[i]].fullyPaid == true, "A participant didn't fully pay. Extend Deadline or Emergency Withdrawal.");
            }
        }

        // randomly pick a winner
        getRandomNumber();
        address winnerAddress = getRandomWinnerAddress(circleId);

        // send funds to winner
        (bool sent, ) = winnerAddress.call{value: idToCircle[circleId].saveAmount}("");

        // remove winner from being chosen again
        if (!sent) {
            removeWinner(randomResult.mod(idToCircle[circleId].possibleWinnerAddresses.length).add(1), circleId);
        }

        require(sent, "Failed to send Ether");

        // check if it's the final round
        if (
            idToCircle[circleId].stats.roundCounter == idToCircle[circleId].stats.participantCounter && 
            idToCircle[circleId].possibleWinnerAddresses.length == 0
        ) {
            idToCircle[circleId].stats.stage = Stages.Finished;
            emit AllRoundsCompleted(circleId);
            return;
        }

        // increment round to next one
        idToCircle[circleId].stats.roundCounter++;

        // reset participant data for new round & stage stats data
        for (uint8 i = 0; i < idToCircle[circleId].stats.participantCounter; i++) {
            users[idToCircle[circleId].participantAddresses[i]].fullyPaid = false;
            users[idToCircle[circleId].participantAddresses[i]].amountPaid = 0;
        }
        idToCircle[circleId].stats.paidCounter = 0; // participants that paid
        idToCircle[circleId].stats.roundStartTime = block.timestamp; // start time of round
        emit RoundEndedAndUserWasPaidOut(circleId, winnerAddress, sent);
    }

    /* 
        Stage: FINISHED
    */
    function completeCircle(bytes32 circleId) public onlyHost(idToCircle[circleId].host) atStage(circleId, Stages.Finished)  {
        require (
            idToCircle[circleId].possibleWinnerAddresses.length == 0 && idToCircle[circleId].stats.roundCounter == idToCircle[circleId].stats.participantCounter,
            "Not everyone has been paid out so saving circle cannot be completed."
        );
        emit CompleteCircle(circleId);
    }

    /* 
        Chainlink VRF Helper Functions 
    */

    function getRandomNumber() public returns (bytes32 requestId) {
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness;
    }

    function getRandomWinnerAddress(bytes32 circleId) internal view returns (address addr) {
        addr = idToCircle[circleId].possibleWinnerAddresses[randomResult.mod(idToCircle[circleId].possibleWinnerAddresses.length).add(1)];
    }

    function removeWinner(uint256 index, bytes32 circleId) internal {
        require(
            index < idToCircle[circleId].possibleWinnerAddresses.length,
            "removeWinner: Index Out of Bounds."
        );
        for (uint i = index; i < idToCircle[circleId].possibleWinnerAddresses.length - 1; i++) {
            idToCircle[circleId].possibleWinnerAddresses[i] = idToCircle[circleId].possibleWinnerAddresses[i + 1];
        }
        idToCircle[circleId].possibleWinnerAddresses.pop();
    }

    /* 
    
    Stage: EMERGENCY
    */

    // extend deadline by 7 days for round so participants have more time to pay
    function extendDeadline(bytes32 circleId) public onlyHost(idToCircle[circleId].host) atStage(circleId, Stages.Emergency) {
        idToCircle[circleId].payTime += 7;
    }

    // uninvests money & splits all collected money to return to all participants expect participant that didn't pay. Ends Circle.
    function emergencyWithdrawal(bytes32 circleId)
        public
        onlyHost(idToCircle[circleId].host)
        atStage(circleId, Stages.Emergency)
    {
        // require that there are funds available to pay out
        require(address(this).balance > 0, "No funds to distribute.");

        address[] memory paid; // keep track of who has paid
        for (uint8 i = 0; i < idToCircle[circleId].stats.participantCounter; i++) {
            if (users[idToCircle[circleId].participantAddresses[i]].fullyPaid) {
                paid[i] = (idToCircle[circleId].participantAddresses[i]);
            }
        }


        // only pay those who have been paying
        for (uint8 i = 0; i < paid.length; i++) {
            (bool sent, ) = paid[i].call{
                value: (address(this).balance / paid.length)
            }("");
            require(sent, "Failed to send Ether");
            emit EmergencyWithdrawal(
                circleId,
                address(this).balance,
                paid[i],
                (address(this).balance / paid.length)
            );
        }
    }
}
