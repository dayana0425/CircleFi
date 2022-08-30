import abiJSON from "../utils/Main.json";
import { ethers } from "ethers";

async function createCircle(amount, groupSize, payTime) {
console.log('create circle contract');
  const contractAddress = "0xa3eC5F9725836D8ed92d420aBf31938969aF97C8";
  const contractABI = abiJSON.abi;
  const { ethereum } = window;

  const provider = new ethers.providers.Web3Provider(ethereum);
  console.log(provider);
  const signer = provider.getSigner();

  const mainContract = new ethers.Contract(contractAddress, contractABI, signer);
  console.log("🚀 ~ file: createCircle.js ~ line 14 ~ createCircle ~ mainContract address ", mainContract.address);
  

  const savingCircleAddress = await mainContract.createSavingCircle(amount, groupSize, payTime);
  console.log("🚀 ~ file: createCircle.js ~ line 18 ~ createCircle ~ createSavingCircle", savingCircleAddress)
}

export default createCircle;
