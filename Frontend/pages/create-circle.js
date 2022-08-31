import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ethers } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Alert from "../components/Alert";
import connectContract from "../utils/connectContract";
import getRandomImage from "../utils/getRandomImage";


export default function CreateEvent() {
  const { data: account } = useAccount();

  const [circleName, setCircleName] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  const [success, setSuccess] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(null);
  const [eventID, setEventID] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const mainContract = connectContract();
      console.log("mainContract", mainContract.address);

      setLoading(true);

      let deposit = ethers.utils.parseEther(contributionAmount);
      let eventDateAndTime = new Date(`${eventDate} ${eventTime}`);
      setEventDate(eventDateAndTime);
      setEventTime(eventDateAndTime);

      let payTime;
      switch (frequency) {
        case "weekly":
          payTime = 7;
          break;
        case "biweekly":
          payTime = 14;
          break;
        case "monthly":
          payTime = 30;
          break;
      }

      const body = {
        name: circleName,
        description: eventDescription,
        image: getRandomImage(),
        frequency: frequency
      };

      const response = await fetch("/api/store-event-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status !== 200) {
        alert("Oops! Something went wrong. Please refresh and try again. Response Status: ", reponse.status);
      } else {
        let responseJSON = await response.json();
        const txn = await mainContract.createSavingCircle(
          deposit,
          maxCapacity,
          payTime,
          responseJSON.cid,
          { value: deposit,
            gasLimit: 7000000,
          }
        );
        console.log("Minting New Saving Circle...", txn.hash);
        let wait = await txn.wait();
        console.log("Minted -- ", txn.hash);
        console.log("Circle ID: ", wait.events[1].args.circleId);
        setEventID(wait.events[1].args.circleId);
        setSuccess(true);
        setLoading(false);
        setMessage("Your saving circle has been created successfully.");
      }
    } catch (error) {
      alert(
        `Oops! Something went wrong. Please refresh and try again. Error ${error}`
      );
    }
  }

  useEffect(() => {
    document.addEventListener("wheel", (event) => {
      if (document.activeElement.type === "number") {
        document.activeElement.blur();
      }
    });
  });

  function previewCircleDetails(maxCapacity, frequency) {
    if (!maxCapacity || !frequency) {
      return "";
    }

    let totalLength;
    if (frequency === "biweekly") {
      totalLength = `${maxCapacity * 2} weeks`;
    } else if (frequency === "weekly") {
      totalLength = `${maxCapacity} weeks`;
    } else if (frequency === "monthly") {
      totalLength = `${maxCapacity} months`;
    }

    let weekAmt =
      frequency === "weekly"
        ? "1 week"
        : frequency === "biweekly"
        ? "2 weeks"
        : "1 month";

    return (
      <div>
        <div>
          Each member will contribute {contributionAmount} ETH per round
        </div>
        <div>Each round lasts for {weekAmt}</div>
        <div>
          Every round, 1 member will be randomly selected to receive the full
          pool amount of {maxCapacity * contributionAmount} ETH
        </div>
        <div>This goes on for {totalLength}</div>
        <div>
          By the end, each member will have had a chance to win the full pool
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Create Your Saving Circle | CircleFi</title>
        <meta
          name="description"
          content="Create your saving circle on the blockchain"
        />
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
        {!success && (
          <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl mb-4">
            Create a savings circle
          </h1>
        )}
        {account && !success && (
          <form
            onSubmit={handleSubmit}
            className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-6 sm:space-y-5">
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                <label
                  htmlFor="eventname"
                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  Circle name
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input
                    id="event-name"
                    name="event-name"
                    type="text"
                    className="block max-w-lg w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                    required
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}/>
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                <label
                  htmlFor="max-capacity"
                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  Capacity
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Limit the number of spots available for your savings circle.
                  </p>
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input
                    type="number"
                    name="max-capacity"
                    id="max-capacity"
                    min="1"
                    placeholder="0"
                    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border border-gray-300 rounded-md"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}/>
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                <label
                  htmlFor="refundable-deposit"
                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  Contribution Amount
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    How much each member contributes to the savings circle (in ETH)
                  </p>
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input
                    type="number"
                    name="refundable-deposit"
                    id="refundable-deposit"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border border-gray-300 rounded-md"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                <label
                  htmlFor="frequency"
                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  Frequency
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Set how often members will contribute to the savings circle
                  </p>
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <select
                    name="frequency"
                    id="frequency"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border border-gray-300 rounded-md"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}>
                    <option
                      disabled="disabled"
                      value=""
                      id="frequency-placeholder"
                      style={{ color: "red" }}>
                      Select frequency
                    </option>
                    <option value="weekly">Every week</option>
                    <option value="biweekly">Every 2 weeks</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>
              </div>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  Circle description
                  <p className="mt-2 text-sm text-gray-400">
                    Let people know what your circle is about and your savings
                    goals!
                  </p>
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <textarea
                    id="about"
                    name="about"
                    rows={10}
                    className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}/>
                </div>
              </div>
            </div>
            {previewCircleDetails(maxCapacity, frequency)}
            <div className="pt-5">
              <div className="flex justify-end">
                <Link href="/">
                  <a className="bg-white py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Cancel
                  </a>
                </Link>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Create
                </button>
              </div>
            </div>
          </form>
        )}
        {success && eventID && (
          <div>
            Success! Please wait a few minutes, then check out your saving circle page{" "}
            <span className="font-bold">
              <Link href={`/circles/${eventID}`}>here</Link>
            </span>
          </div>
        )}
        {!account && (
          <section className="flex flex-col items-start py-8">
            <p className="mb-4">
              Please connect your wallet to create circles.
            </p>
            <ConnectButton />
          </section>
        )}
      </section>
    </div>
  );
}
