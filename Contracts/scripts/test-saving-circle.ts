import { ethers } from "hardhat";
import "dotenv/config";

const main = async () => {
  const mainContractFactory = await ethers.getContractFactory('Main');
  const mainContract = await mainContractFactory.deploy();
  await mainContract.deployed();
  console.log("Contract deployed to:", mainContract.address);

  const [host, address1, address2, address3] = await ethers.getSigners();
  const saveAmountPerRound = ethers.utils.parseEther("0.001");
  const groupSize = 4;
  const payTime = 1;
  let savingCircleAddress;

  let txn = await mainContract.createSavingCircle(saveAmountPerRound, groupSize, payTime);
  let wait = await txn.wait();
  if(wait.events) {
    console.log("SAVING CIRCLE CREATED EVENT:", wait.events[3].event, wait.events[3].args);
    if(wait.events[3].args) {
        savingCircleAddress = wait.events[3].args[0];
    }
    else{
        savingCircleAddress = '';
    }
    console.log("PARTICIPANTS: ", host.address, address1.address, address2.address, address3.address);
    console.log("SAVE AMOUNT PER ROUND: " + saveAmountPerRound);
    console.log("GROUP SIZE: ", groupSize);
    console.log("PAY TIME: ", payTime);
  }
  else {
    console.log("ERROR IN CREATING SAVING CIRCLE");
  }
  console.log("NEW SAVING CIRCLE ADDRESS: ", savingCircleAddress);

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