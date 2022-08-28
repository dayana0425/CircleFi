import { ethers } from "ethers";
import "dotenv/config";
import * as mainJson from "../artifacts/contracts/Main.sol/Main.json";

// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";


/*
    Deployment Script of Main.sol
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

  console.log("Deploying Main Contract");

  const MainContractFactory = new ethers.ContractFactory (
    mainJson.abi,
    mainJson.bytecode,
    signer
  );

  const mainContract = await MainContractFactory.deploy();
  console.log("Awaiting confirmations");
  await mainContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${mainContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});