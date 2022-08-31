import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { gql } from "@apollo/client";
import client from "../../apollo-client";
import { ethers } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import connectContract from "../../utils/connectContract";
import formatTimestamp from "../../utils/formatTimestamp";
import Alert from "../../components/Alert";
import {
  EmojiHappyIcon,
  TicketIcon,
  UsersIcon,
  LinkIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/outline";

function checkIfAlreadyRegistered() {
  if (account) {
    for (let i = 0; i < event.participantAddr.length; i++) {
      const thisAccount = account.address.toLowerCase();
      if (event.rsvps[i].attendee.id.toLowerCase() == thisAccount) {
        return true;
      }
    }
  }
  return false;
}

function Event({ event }) {
  const { data: account } = useAccount();
  const [success, setSuccess] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(null);

  const registerToSavingCircle = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);
      console.log("account: ", account.address);

      if (mainContract) {
        const txn = await mainContract.registerToSavingCircle(event.id, {
          value: event.saveAmount,
          gasLimit: 3000000,
        });
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage("You successfully registered!");
      } else {
        console.log(
          "Error calling contract function: registerToSavingCircle()."
        );
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in registering. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const makePayment = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      if (mainContract) {
        const txn = await mainContract.makePayment(event.id, {
          value: event.saveAmount,
          gasLimit: 3000000,
        });
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage("You successfully paid for the round!");
      } else {
        console.log("Error calling contract function: makePayment().");
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in paying. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const startFirstRound = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      if (mainContract) {
        const txn = await mainContract.startFirstRound(event.id);
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage("You successfully started the first round!");
      } else {
        console.log(
          "Error getting calling contract function: startFirstRound()"
        );
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in starting next round. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const endRoundAndStartNextRound = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      if (mainContract) {
        const txn = await mainContract.endRoundAndStartNextRound(event.id);
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage("You successfully ended the round & started the next one!");
      } else {
        console.log(
          "Error getting calling contract function: startFirstRound()"
        );
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in starting next round. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const completeCircle = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      if (mainContract) {
        const txn = await mainContract.completeCircle(event.id);
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage("Circle Completed!");
      } else {
        console.log(
          "Error getting calling contract function: completeCircle()"
        );
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in completing circle. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const extendDeadline = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      if (mainContract) {
        const txn = await mainContract.extendDeadline(event.id);
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage("Deadline successfully extended.");
      } else {
        console.log(
          "Error getting calling contract function: extendDeadline()"
        );
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in extending deadline. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const emergencyWithdrawal = async () => {
    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      if (mainContract) {
        const txn = await mainContract.emergencyWithdrawal(event.id);
        setLoading(true);
        console.log("Minting...", txn.hash);
        await txn.wait();
        console.log("Minted -- ", txn.hash);
        setSuccess(true);
        setLoading(false);
        setMessage(
          "Emergency withdrawal successfully completed. Everyone recieved their funds back."
        );
      } else {
        console.log(
          "Error getting calling contract function: emergencyWithdrawal()"
        );
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Error in emergency withdrawal. Try Again.");
      setLoading(false);
      console.log(error);
    }
  };

  const hostControls = () => {
    return (
      <div>
        <div className="flex item-center">
          <span className="truncate">
            <button
              type="button"
              className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-green-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={startFirstRound}
            >
              Start First Round
            </button>
          </span>
        </div>
        <div className="flex item-center">
          <span className="truncate">
            <button
              type="button"
              className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-green-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={endRoundAndStartNextRound}
            >
              End Round
            </button>
          </span>
        </div>
        <div className="flex item-center">
          <span className="truncate">
            <button
              type="button"
              className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-green-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={endRoundAndStartNextRound}
            >
              Complete Saving Circle
            </button>
          </span>
        </div>
        <div className="flex item-center">
          <span className="truncate">
            <button
              type="button"
              className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-pink-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={extendDeadline}
            >
              Extend Deadline For Round
            </button>
          </span>
        </div>
        <div className="flex item-center">
          <span className="truncate">
            <button
              type="button"
              className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-pink-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={emergencyWithdrawal}
            >
              Emergency Withdrawl
            </button>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{event.circleName} | CircleFi</title>
        <meta name="description" content={event.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="relative py-12">
        {loading && (
          <Alert
            alertType={"loading"}
            alertBody={"Please wait"}
            triggerAlert={true}
            color={"white"}
          />
        )}
        {success && (
          <Alert
            alertType={"success"}
            alertBody={message}
            triggerAlert={true}
            color={"palegreen"}
          />
        )}
        {success === false && (
          <Alert
            alertType={"failed"}
            alertBody={message}
            triggerAlert={true}
            color={"palevioletred"}
          />
        )}
        {/* <h6 className="mb-2">{formatTimestamp(event.eventTimestamp)}</h6> */}
        <div className="flex flex-row items-center font-thick text-xl">          
        {event.imageURL && (
          <Image
            className="rounded-full"
            src={event.imageURL}
            alt="event image"
            width="100px"
            height="100px"
          />
        )}
        <h1 className="text-4xl tracking-tight">
          {event.circleName}
        </h1>
        </div>
        <div className="flex flex-wrap-reverse lg:flex-nowrap">
          <div className="w-full pr-0 lg:pr-24 xl:pr-32">
            {/* <div className="mb-8 w-full aspect-w-10 aspect-h-7 rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-indigo-500 overflow-hidden "> */}
            {/* </div> */}
            <p>{event.description}</p>
          </div>
          <div className="max-w-xs w-full flex flex-col gap-4 mb-6 lg:mb-0">
            <div className="flex item-center">
              {parseInt(event.round) === 0 ? (
                <XCircleIcon className="w-6 mr-2" />
              ) : (
                <CheckCircleIcon className="w-6 mr-2" />
              )}

              <span className="truncate">
                {parseInt(event.round) === 0
                  ? "Round 0 - Circle starting soon"
                  : `Round ${event.round}`}
              </span>
            </div>
            <div className="flex item-center">
              <UsersIcon className="w-6 mr-2" />
              <span className="truncate">
                {event.participantCounter} / {event.groupSize} attending
              </span>
            </div>
            <div className="flex items-center">
              <EmojiHappyIcon className="w-10 mr-2" />
              <span className="truncate">
                Hosted by{" "}
                <a
                  className="text-indigo-800 truncate hover:underline"
                  href={`${process.env.NEXT_PUBLIC_TESTNET_EXPLORER_URL}address/${event.eventOwner}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {event.host}
                </a>
              </span>
            </div>
            <div className="flex item-center">
              <span className="truncate">
                {account ? (
                  <button
                    type="button"
                    className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={registerToSavingCircle}
                  >
                    Register for {ethers.utils.formatEther(event.saveAmount)}{" "}
                    ETH
                  </button>
                ) : (
                  <ConnectButton />
                )}
              </span>
            </div>
            <div className="flex item-center">
              <span className="truncate">
                {account ? (
                  <button
                    type="button"
                    className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={makePayment}
                  >
                    Make Payment
                  </button>
                ) : (
                  "Make Payments Once Round Begins"
                )}
              </span>
            </div>
            {account ? (
              account.address.toString().toLowerCase().trim() ===
              event.host.toString().trim() ? (
                <div className="flex flex-col gap-4 border border-2 border-indigo-200 rounded-md p-4">
                  <h1 className="text-indigo-700">Host Controls</h1>
                  <div className="flex item-center">
                    <span className="truncate">
                      <button
                        type="button"
                        className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-green-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={startFirstRound}
                      >
                        Start First Round
                      </button>
                    </span>
                  </div>
                  <div className="flex item-center">
                    <span className="truncate">
                      <button
                        type="button"
                        className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-green-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={endRoundAndStartNextRound}
                      >
                        End Round
                      </button>
                    </span>
                  </div>
                  <div className="flex item-center">
                    <span className="truncate">
                      <button
                        type="button"
                        className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-green-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={endRoundAndStartNextRound}
                      >
                        Complete Saving Circle
                      </button>
                    </span>
                  </div>
                  <div className="flex item-center">
                    <span className="truncate">
                      <button
                        type="button"
                        className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-pink-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={extendDeadline}
                      >
                        Extend Deadline For Round
                      </button>
                    </span>
                  </div>
                  <div className="flex item-center">
                    <span className="truncate">
                      <button
                        type="button"
                        className="w-full items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-pink-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={emergencyWithdrawal}
                      >
                        Emergency Withdrawl
                      </button>
                    </span>
                  </div>
                </div>
              ) : (
                ""
              )
            ) : (
              ""
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
export default Event;

export async function getServerSideProps(context) {
  const { id } = context.params;
  console.log(id);
  const { data } = await client.query({
    query: gql`
      query SavingCircle($id: String!) {
        savingCircle(id: $id) {
          id
          circleName
          frequency
          groupSize
          participantCounter
          round
          host
          imageURL
          description
          saveAmount
        }
      }
    `,
    variables: {
      id: id,
    },
  });

  return {
    props: {
      event: data.savingCircle,
    },
  };
}

export const config = {
  unstable_excludeFiles: ["public/**/*"],
};
