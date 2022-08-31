import { ethers } from "hardhat";
import "dotenv/config";

const EXPOSED_KEY = "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const main = async () => {
    const mainContractFactory = await ethers.getContractFactory('SimpleSavingCircle');
    const mainContract = await mainContractFactory.deploy();
    await mainContract.deployed();
    console.log("Contract deployed to:", mainContract.address);

    if (process.argv.length < 2) throw new Error("Save Amount Per Round Missing.");
    const saveAmountPerRound = ethers.utils.parseEther(process.argv[2].toString());
    console.log("Save Amount Per Round: ", saveAmountPerRound);
    if (process.argv.length < 3) throw new Error("Group Size Missing.");
    const groupSize = process.argv[3];
    console.log("Group Size: ", groupSize);
    if (process.argv.length < 4) throw new Error("Pay Time Missing.");
    const payTime = process.argv[4];
    console.log("Pay Time (Days): ", payTime);
    if (process.argv.length < 5) throw new Error("Cid Is Missing.");
    const cid = process.argv[5];
    console.log("cid: ", cid);
    const [host, address1, address2, address3] = await ethers.getSigners();
    console.log("Participants: ");
    console.log("Host/Participant 0: ", host.address);
    console.log("Participant 1: ", address1.address);
    console.log("Participant 2: ", address2.address);
    console.log("Participant 3: ", address3.address);

    // create saving circle
    let txn = await mainContract.connect(host).createSavingCircle(saveAmountPerRound, groupSize, payTime, cid, {value: saveAmountPerRound});
    let wait = await txn.wait();
    let circleID;
    let circleHost;
    if(wait.events && wait.events[1].args) {
        console.log("NEW CIRCLE CREATED:", wait.events[1].event);
        circleID = wait.events[1].args.circleId;
        circleHost = wait.events[1].args.host;
        console.log("CIRCLE ID:", circleID);
        console.log("CIRCLE HOST", circleHost);
    }

    // registerToSavingCircle
    txn = await mainContract.connect(address1).registerToSavingCircle(circleID, {value: saveAmountPerRound});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Registered User:", wait.events[0].event,  wait.events[0].args);
    }
    txn = await mainContract.connect(address2).registerToSavingCircle(circleID, {value: saveAmountPerRound});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Registered User:", wait.events[0].event,  wait.events[0].args);
    }
    txn = await mainContract.connect(address3).registerToSavingCircle(circleID, {value: saveAmountPerRound});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Registered User:", wait.events[0].event,  wait.events[0].args);
        console.log("Everyone Registered: ", wait.events[1].event, wait.events[1].args);
    }

    // startFirstRound
    txn = await mainContract.connect(host).startFirstRound(circleID);
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("First Round:", wait.events[0].event,  wait.events[0].args);
    }

    // make payment
    txn = await mainContract.connect(host).makePayment(circleID, {value: saveAmountPerRound});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Paid:", wait.events[0].event,  wait.events[0].args);
    }

    txn = await mainContract.connect(address1).makePayment(circleID, {value: saveAmountPerRound.div(2)});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Paid:", wait.events[0].event,  wait.events[0].args);
    }

    txn = await mainContract.connect(address1).makePayment(circleID, {value: saveAmountPerRound.div(2)});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Paid:", wait.events[0].event,  wait.events[0].args);
    }

    txn = await mainContract.connect(address2).makePayment(circleID, {value: saveAmountPerRound});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Paid:", wait.events[0].event,  wait.events[0].args);
    }

    txn = await mainContract.connect(address3).makePayment(circleID, {value: saveAmountPerRound});
    wait = await txn.wait();
    if(wait.events && wait.events[0].args) {
        console.log("Paid:", wait.events[0].event,  wait.events[0].args);
        console.log(wait.events[1].event, wait.events[1].args);
    }

    // endRoundAndStartNextRound
    // txn = await mainContract.connect(host).endRoundAndStartNextRound(circleID);
    // wait = await txn.wait();
    // if(wait.events && wait.events[0].args) {
    //     console.log("Paid Out:", wait.events[0].event,  wait.events[0].args);
    // }
}

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