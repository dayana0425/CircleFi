// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

import "./Modifiers.sol";

contract SavingGroups is Modifiers, VRFConsumerBase {
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
        uint256 availableSavings;// Amount Available to Withdraw
        bool isActive; // Defines if the user is participating in the current saving circle
        uint256 amountPaid; // What they paid so far for the current round - reinitialize when round ends
        bool fullyPaid; // If user paid the full amount for the current round - reintialize when round ends
    }

    // Saving Circle Variables
    address public host; // The user that deploy the contract is the administrator / host
    uint256 public depositFee; // The deposit fee the host will charge to the participants to be payed as commitment at the begining of the saving circle
    uint256 public saveAmount; // Payment on each round/cycle
    uint256 public groupSize; // Number of slots for users to participate on the saving circle
    address public devFund; // The deposit fees will be sent here
    uint256 public payTime = 0; // How many days users have to pay per round
    mapping(address => Participant) public participants; // participants account address maps to their data
    address[] memory participantAddresses; // stores all participants addresses

    // Counters and flags for saving circle
    uint256 participantCounter = 0; // Keeps track of how many participants are registered
    uint256 public totalDepositsSum = 0; // Keeps track of all deposits collected
    Stages public stage; // Stage that the saving circle is at

    // Counters and flags for rounds - must be reinitialized/changed once a new round begins
    uint256 paidCounter = 0; // participants that paid 
    uint8 public round = 1; // Current round
    uint256 public startTime; // start time of round


    // Events
    event SavingCircleEstablished(uint256 indexed saveAmount, uint256 indexed groupSize);
    event RegisterUser(address indexed user);
    event PayDeposit(address indexed user, bool indexed success);
    event PayRound(address indexed user, bool indexed success);
    event ParticipantFullyPaidForRound(address indexed user, bool indexed success);
    event RoundStarted(uint256 startTime);

    event WithdrawFunds(address indexed user, uint256 indexed amount, bool indexed success);
    event EndRound(address indexed roundAddress, uint256 indexed startAt, uint256 indexed endAt);
    event EmergencyWithdraw(address indexed roundAddress, uint256 indexed funds);

    constructor (
        uint256 _saveAmountPerRound,
        uint256 _groupSize,
        address _host,
        uint256 _payTime,
        address _devFund,
    ) public {
        require(_host != address(0), "Host's address cannot be zero");
        require(_groupSize > 1 && _groupSize <= 12, "_groupSize must be greater than 1 and less than or equal to 12");
        require(_saveAmountPerRound >= 1, "Saving Amount cannot be less than 1 ETH");
        require(_payTime >= 1, "Pay Time cannot be less than a day.");

        // saving circle setup
        host = _host;
        depositFee = _saveAmountPerRound;
        saveAmount = _saveAmountPerRound;
        groupSize = _groupSize;
        devFund = _devFund;
        stage = Stages.Setup;
        payTime = _payTime;
        
        //randomness setup
        VRFConsumerBase(vrfCoordinator, link) { 
            keyHash = _keyhash;
            fee = _fee;
            admin = msg.sender;
        }

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
        participants[msg.sender] = Participant(msg.sender, msg.value, 0, true, 0, 0, false); // user address, deposit fee, savings amount, active in circle, amount paid *SO FAR* for round, if they fully paid
        totalDepositsSum += depositFee; // keeping track of all deposits paid so far

        emit PayDeposit(msg.sender, true);
        emit RegisterUser(msg.sender);
    }

    function startRounds() external onlyAdmin(host) atStage(Stages.Setup) {
        require(participantCounter == groupSize, "There are still spots left. All spots must be filled in order to start the rounds.");
        stage = Stages.Save;
        startTime = block.timestamp;
        emit RoundStarted(startTime);
    }

    function makePayment() external payable isRegisteredParticipant(participants[msg.sender].isActive) atStage(Stages.Save) {
        // get payment value
        uint256 _payAmount = msg.value;
        // require that the participant hasn't fully paid yet
        require(participantsp[msg.sender].fullyPaid == false, "You already paid for this round. Wait until next round starts.")
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


    function endRound() private onlyAdmin(host) atStage(Stages.Save) {
        // require that it's before the deadline
        if(!(block.timestamp <= (startTime + payTime days)){
            stage = Stages.Emergency;
            require(block.timestamp <= (startTime + payTime days), "CANNOT END AFTER BEFORE THE DEADLINE. Extend Deadline or Emergency Withdrawal.");
        }
        // require that all participants have paid
        for (uint8 i = 0; i < participantCounter; i++) {
            Participant currentParticipant = participants[participantAddresses[i]];
            if(!currentParticipant.fullyPaid){ // a participant didn't fully pay
                stage = Stages.Emergency;
                require(currentParticipant.fullyPaid == true, "A participant didn't fully pay. Extend Deadline or Emergency Withdrawal.")
            }
        }

        // randomly pick a winner & distribute funds

        // increment round to next one
        round++; 
        // reset participant data for new round
        for (uint8 i = 0; i < participantCounter; i++) {
            Participant currentParticipant = participants[participantAddresses[i]];
            currentParticipant.fullyPaid = false;
            currentParticipant.amountPaid = 0;   
        }
        // reinitialize round flags and counters
        paidCounter = 0; // participants that paid 
        startTime = block.timestamp; // start time of round
    }

    function pickWinner() internal atStage(Stages.Save) {

    }

    // allow host to complete & archive the circle once it's the last round 
    function completeCircle public atStage(Stages.Save) {
        

    }

    // extend deadline for round so participants have more time to pay
    function extendDeadline public onlyAdmin(host) atStage(Stages.Emergency) {

    }

    // uninvests money & splits all collected money to return to all participants expect participant that didn't pay. Ends Circle.
    function emergencyWithdrawal() public onlyAdmin(host) atStage(Stages.Emergency) { 

    }




 
