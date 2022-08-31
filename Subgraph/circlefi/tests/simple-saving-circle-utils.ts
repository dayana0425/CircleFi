import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AllRoundsCompleted,
  CompleteCircle,
  EmergencyWithdrawal,
  EveryonePaid,
  EveryonePaidDeposit,
  NewSavingCircleCreated,
  PaidRound,
  PartiallyPaidRound,
  RegisteredNewUserAndPaidDeposit,
  RoundEndedAndUserWasPaidOut,
  StartedFirstRound
} from "../generated/SimpleSavingCircle/SimpleSavingCircle"

export function createAllRoundsCompletedEvent(
  circleId: Bytes
): AllRoundsCompleted {
  let allRoundsCompletedEvent = changetype<AllRoundsCompleted>(newMockEvent())

  allRoundsCompletedEvent.parameters = new Array()

  allRoundsCompletedEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )

  return allRoundsCompletedEvent
}

export function createCompleteCircleEvent(circleId: Bytes): CompleteCircle {
  let completeCircleEvent = changetype<CompleteCircle>(newMockEvent())

  completeCircleEvent.parameters = new Array()

  completeCircleEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )

  return completeCircleEvent
}

export function createEmergencyWithdrawalEvent(
  circleId: Bytes,
  totalFunds: BigInt,
  participantAddress: Address,
  sentFunds: BigInt
): EmergencyWithdrawal {
  let emergencyWithdrawalEvent = changetype<EmergencyWithdrawal>(newMockEvent())

  emergencyWithdrawalEvent.parameters = new Array()

  emergencyWithdrawalEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  emergencyWithdrawalEvent.parameters.push(
    new ethereum.EventParam(
      "totalFunds",
      ethereum.Value.fromUnsignedBigInt(totalFunds)
    )
  )
  emergencyWithdrawalEvent.parameters.push(
    new ethereum.EventParam(
      "participantAddress",
      ethereum.Value.fromAddress(participantAddress)
    )
  )
  emergencyWithdrawalEvent.parameters.push(
    new ethereum.EventParam(
      "sentFunds",
      ethereum.Value.fromUnsignedBigInt(sentFunds)
    )
  )

  return emergencyWithdrawalEvent
}

export function createEveryonePaidEvent(
  circleId: Bytes,
  amountPaid: BigInt
): EveryonePaid {
  let everyonePaidEvent = changetype<EveryonePaid>(newMockEvent())

  everyonePaidEvent.parameters = new Array()

  everyonePaidEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  everyonePaidEvent.parameters.push(
    new ethereum.EventParam(
      "amountPaid",
      ethereum.Value.fromUnsignedBigInt(amountPaid)
    )
  )

  return everyonePaidEvent
}

export function createEveryonePaidDepositEvent(
  circleId: Bytes
): EveryonePaidDeposit {
  let everyonePaidDepositEvent = changetype<EveryonePaidDeposit>(newMockEvent())

  everyonePaidDepositEvent.parameters = new Array()

  everyonePaidDepositEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )

  return everyonePaidDepositEvent
}

export function createNewSavingCircleCreatedEvent(
  circleId: Bytes,
  circleCid: string,
  host: Address,
  payTime: BigInt,
  saveAmount: BigInt,
  groupSize: BigInt,
  participantAddresses: Array<Address>,
  possibleWinnerAddresses: Array<Address>,
  stats: ethereum.Tuple
): NewSavingCircleCreated {
  let newSavingCircleCreatedEvent = changetype<NewSavingCircleCreated>(
    newMockEvent()
  )

  newSavingCircleCreatedEvent.parameters = new Array()

  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam("circleCid", ethereum.Value.fromString(circleCid))
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam("host", ethereum.Value.fromAddress(host))
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "payTime",
      ethereum.Value.fromUnsignedBigInt(payTime)
    )
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "saveAmount",
      ethereum.Value.fromUnsignedBigInt(saveAmount)
    )
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "groupSize",
      ethereum.Value.fromUnsignedBigInt(groupSize)
    )
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "participantAddresses",
      ethereum.Value.fromAddressArray(participantAddresses)
    )
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "possibleWinnerAddresses",
      ethereum.Value.fromAddressArray(possibleWinnerAddresses)
    )
  )
  newSavingCircleCreatedEvent.parameters.push(
    new ethereum.EventParam("stats", ethereum.Value.fromTuple(stats))
  )

  return newSavingCircleCreatedEvent
}

export function createPaidRoundEvent(
  circleId: Bytes,
  participant: Address
): PaidRound {
  let paidRoundEvent = changetype<PaidRound>(newMockEvent())

  paidRoundEvent.parameters = new Array()

  paidRoundEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  paidRoundEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )

  return paidRoundEvent
}

export function createPartiallyPaidRoundEvent(
  circleId: Bytes,
  participant: Address,
  amountPaid: BigInt
): PartiallyPaidRound {
  let partiallyPaidRoundEvent = changetype<PartiallyPaidRound>(newMockEvent())

  partiallyPaidRoundEvent.parameters = new Array()

  partiallyPaidRoundEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  partiallyPaidRoundEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )
  partiallyPaidRoundEvent.parameters.push(
    new ethereum.EventParam(
      "amountPaid",
      ethereum.Value.fromUnsignedBigInt(amountPaid)
    )
  )

  return partiallyPaidRoundEvent
}

export function createRegisteredNewUserAndPaidDepositEvent(
  circleId: Bytes,
  participant: Address
): RegisteredNewUserAndPaidDeposit {
  let registeredNewUserAndPaidDepositEvent = changetype<
    RegisteredNewUserAndPaidDeposit
  >(newMockEvent())

  registeredNewUserAndPaidDepositEvent.parameters = new Array()

  registeredNewUserAndPaidDepositEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  registeredNewUserAndPaidDepositEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )

  return registeredNewUserAndPaidDepositEvent
}

export function createRoundEndedAndUserWasPaidOutEvent(
  circleId: Bytes,
  winner: Address,
  success: boolean
): RoundEndedAndUserWasPaidOut {
  let roundEndedAndUserWasPaidOutEvent = changetype<
    RoundEndedAndUserWasPaidOut
  >(newMockEvent())

  roundEndedAndUserWasPaidOutEvent.parameters = new Array()

  roundEndedAndUserWasPaidOutEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  roundEndedAndUserWasPaidOutEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner))
  )
  roundEndedAndUserWasPaidOutEvent.parameters.push(
    new ethereum.EventParam("success", ethereum.Value.fromBoolean(success))
  )

  return roundEndedAndUserWasPaidOutEvent
}

export function createStartedFirstRoundEvent(
  circleId: Bytes,
  participant: Address
): StartedFirstRound {
  let startedFirstRoundEvent = changetype<StartedFirstRound>(newMockEvent())

  startedFirstRoundEvent.parameters = new Array()

  startedFirstRoundEvent.parameters.push(
    new ethereum.EventParam("circleId", ethereum.Value.fromFixedBytes(circleId))
  )
  startedFirstRoundEvent.parameters.push(
    new ethereum.EventParam(
      "participant",
      ethereum.Value.fromAddress(participant)
    )
  )

  return startedFirstRoundEvent
}
