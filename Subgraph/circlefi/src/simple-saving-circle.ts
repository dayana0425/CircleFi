import { BigInt, Address, ipfs, json } from "@graphprotocol/graph-ts";
import {
  // SimpleSavingCircle,
  // AllRoundsCompleted,
  // CompleteCircle,
  // EmergencyWithdrawal,
  // EveryonePaid,
  // EveryonePaidDeposit,
  NewSavingCircleCreated,
  // PaidRound,
  // PartiallyPaidRound,
  RegisteredNewUserAndPaidDeposit,
  // RoundEndedAndUserWasPaidOut,
  // StartedFirstRound
} from "../generated/SimpleSavingCircle/SimpleSavingCircle"
import { Account, ParticipantsRegistered, Hosting, SavingCircle } from "../generated/schema";
import { integer } from "@protofire/subgraph-toolkit";

export function handleNewSavingCircleCreated(event: NewSavingCircleCreated): void {
  let newCircle = SavingCircle.load(event.params.circleId.toHex());
  if (newCircle == null) {
    newCircle = new SavingCircle(event.params.circleId.toHex());
    newCircle.host = event.params.host;
    newCircle.payTime = event.params.payTime;
    newCircle.saveAmount = event.params.saveAmount;
    newCircle.groupSize = event.params.groupSize;
    newCircle.stage = event.params.stats.stage.toString();
    newCircle.round = event.params.stats.roundCounter;
    newCircle.roundStartTime = event.params.stats.roundStartTime;
    newCircle.participantCounter = event.params.stats.participantCounter;
    newCircle.paidCounter = event.params.stats.paidCounter;
    newCircle.paidDepositCounter = event.params.stats.paidDepositCounter;
    newCircle.paidOut = event.params.stats.paidOut;
    newCircle.everyonePaidDeposit = event.params.stats.everyonePaidDeposit;
  }

  let metadata = ipfs.cat(event.params.circleCid + "/data.json");
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        const name = value.get("name");
        const description = value.get("description");
        const imagePath = value.get("image");
        const frequency = value.get("frequency");
        if (name) {
          newCircle.circleName = name.toString();
        }
        if (description) {
          newCircle.description = description.toString();
        }
        if (frequency) {
          newCircle.frequency = frequency.toString();
        }
        if(imagePath){
          const imageURL = "https://ipfs.io/ipfs/" + event.params.circleCid + imagePath.toString();
          newCircle.imageURL = imageURL;
        } else {
          const fallbackURL = "https://ipfs.io/ipfs/bafybeibssbrlptcefbqfh4vpw2wlmqfj2kgxt3nil4yujxbmdznau3t5wi/event.png";
          newCircle.imageURL = fallbackURL;
        }
      }
    }
    newCircle.save();
}

export function handleRegisteredNewUserAndPaidDeposit(event: RegisteredNewUserAndPaidDeposit): void {
  let id = event.params.circleId.toHex() + event.params.participant.toHex();
  let newRegistration = ParticipantsRegistered.load(id);
  let account = getOrCreateAccount(event.params.participant);
  let thisCircle = SavingCircle.load(event.params.circleId.toHex());
  if (newRegistration == null && thisCircle != null) {
    newRegistration = new ParticipantsRegistered(id);
    newRegistration.attendee = account.id;
    newRegistration.circle = thisCircle.id;
    newRegistration.save();
    if(event.params.participant.toHex() == thisCircle.host.toHex()) {
      let newHosting = Hosting.load(id);
      if(newHosting == null) {
        newHosting = new Hosting(id);
        newHosting.circle = thisCircle.id;
        newHosting.host = account.id;
      }
      account.totalHostedCircles = integer.increment(account.totalHostedCircles);
    }
    thisCircle.save();
    account.totalCurrentCircles = integer.increment(account.totalCurrentCircles);
    account.totalCompletedCircles = integer.ZERO;
    account.save();
  }
}

function getOrCreateAccount(address: Address): Account {
  let account = Account.load(address.toHex());
  if (account == null) {
    account = new Account(address.toHex());
    account.totalCompletedCircles = integer.ZERO;
    account.totalHostedCircles = integer.ZERO;
    account.totalCurrentCircles = integer.ZERO;
    account.save();
  }
  return account;
}

