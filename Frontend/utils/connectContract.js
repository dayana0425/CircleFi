import abiJSON from "../utils/Main.json";
import { ethers } from "ethers";

function connectContract() {
  const contractAddress = "0xa3eC5F9725836D8ed92d420aBf31938969aF97C8";
  const contractABI = abiJSON.abi;
  let mainContract;
  try {
    const { ethereum } = window;

    //checking for eth object in the window, see if they have wallet connected to Mumbai network
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
