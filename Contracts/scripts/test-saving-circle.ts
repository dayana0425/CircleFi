import { ethers } from "hardhat";
import "dotenv/config";
import * as savingCircleJson from "../artifacts/contracts/SavingCircle.sol/SavingCircle.json";
import { getDefaultProvider } from "ethers";

const main = async () => {
  const provider = getDefaultProvider();
  const mainContractFactory = await ethers.getContractFactory('Main');
  const mainContract = await mainContractFactory.deploy();
  await mainContract.deployed();
  console.log("Contract deployed to:", mainContract.address);

  const [host, address1, address2, address3] = await ethers.getSigners();
  const saveAmountPerRound = ethers.utils.parseEther("0.01");
  const deposit = saveAmountPerRound;
  const groupSize = 4;
  const payTime = 1;
  let savingCircleAddress;

  const overrides = { value: deposit }
  let txn = await mainContract.createSavingCircle(saveAmountPerRound, groupSize, payTime, overrides);
  let wait = await txn.wait();
  if(wait.events) {
    console.log("Saving Circle Created from Main.Sol:", wait.events[3].event, wait.events[3].args);
    if(wait.events[3].args) {
        savingCircleAddress = wait.events[3].args[0];
    }
    console.log("Participants: ");
    console.log("Host/Participant 0: ", host.address);
    console.log("Participant 1: ", address1.address);
    console.log("Participant 2: ", address2.address);
    console.log("Participant 3: ", address3.address);
  }

  // saving circle address
  console.log("Saving Circle Address: ", savingCircleAddress);

  // connect to contract that was just created
  let savingCircleContract = new ethers.Contract(savingCircleAddress, savingCircleJson.abi, host);
  let host1 = await savingCircleContract.host();
  console.log("Saving Circle Host: ", host1);

  // get contract balance
  let contractBalance = await savingCircleContract.provider.getBalance(savingCircleContract.address);
  console.log("Contract Balance After Host Creates (ETH): ", ethers.utils.formatEther(contractBalance));

  // register address1
  txn = await savingCircleContract.connect(address1).registerToSavingCircle({value: deposit});
  wait = await txn.wait();
  if(wait.events) {
    console.log("PAID DEPOSIT:", wait.events[0].args);
  }
  contractBalance = await savingCircleContract.provider.getBalance(savingCircleContract.address);
  console.log("Contract Balance After Address1 Registers (ETH): ", ethers.utils.formatEther(contractBalance));

  // register address2
  txn = await savingCircleContract.connect(address2).registerToSavingCircle({value: deposit});
  wait = await txn.wait();
  if(wait.events) {
    console.log("PAID DEPOSIT:", wait.events[0].args);
  }
  contractBalance = await savingCircleContract.provider.getBalance(savingCircleContract.address);
  console.log("Contract Balance After Address2 Registers (ETH): ", ethers.utils.formatEther(contractBalance));

  // register address3
  txn = await savingCircleContract.connect(address3).registerToSavingCircle({value: deposit});
  wait = await txn.wait();
  if(wait.events) {
    console.log("PAID DEPOSIT:", wait.events[0].args);
  }
  contractBalance = await savingCircleContract.provider.getBalance(savingCircleContract.address);
  console.log("Contract Balance After Address3 Registers (ETH): ", ethers.utils.formatEther(contractBalance));

  // participant counter
  let participantCounter = await savingCircleContract.participantCounter();
  console.log("Participant Counter: ", participantCounter);

};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();