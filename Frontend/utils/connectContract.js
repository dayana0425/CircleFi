import abiJSON from "../utils/Main.json";
import { ethers } from "ethers";

function connectContract() {
  /*
     hardcoded the main contract address here for now
     we can also call deploy script to get the address
  */
  const contractAddress = "0xa3eC5F9725836D8ed92d420aBf31938969aF97C8";
  const contractABI = abiJSON.abi;
  let mainContract;
  try {
    const { ethereum } = window;

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    mainContract = new ethers.Contract(contractAddress, contractABI, signer); // instantiating new connection to the contract
  } catch (error) {
    console.log("ERROR:", error);
  }
  console.log("success");
  return mainContract;
}

export default connectContract;
