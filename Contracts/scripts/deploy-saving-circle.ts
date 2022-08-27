import { ethers } from "hardhat";
import "dotenv/config";
import * as savingCircleJson from "../artifacts/contracts/SavingCircle.sol/SavingCircle.json";

// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";


/*
    Deployment Script of SavingCircle.sol
*/
async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = ethers.providers.getDefaultProvider("goerli");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }

  console.log("Deploying Saving Circle Contract");

  const SavingCircleContractFactory = new ethers.ContractFactory (
    savingCircleJson.abi,
    savingCircleJson.bytecode,
    signer
  );

  if (process.argv.length < 2) throw new Error("Save Amount Per Round Missing.");
  const saveAmountPerRound = ethers.utils.parseEther(process.argv[2].toString());
  console.log("Save Amount Per Round: ", saveAmountPerRound);
  if (process.argv.length < 3) throw new Error("Group Size Missing.");
  const groupSize = process.argv[3];
  console.log("Group Size: ", groupSize);
  if (process.argv.length < 4) throw new Error("Pay Time Missing.");
  const payTime = process.argv[4];
  console.log("Pay Time (Days): ", payTime);
  if (process.argv.length < 5) throw new Error("Host Is Missing.");
  const host = process.argv[5];
  console.log("Host: ", host);
// EX Arguments: 0.1, 4, 1, 0xC0c630f5c9A78A75a92617852AD0F4E80BF252Cf
  const savingCircleContract = await SavingCircleContractFactory.deploy(saveAmountPerRound, groupSize, payTime, host);
  console.log("Awaiting confirmations");
  await savingCircleContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${savingCircleContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});