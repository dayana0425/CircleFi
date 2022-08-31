import abiJSON from "./ABI/SimpleSavingCircle.json";
import { ethers } from "ethers";
import { address } from "./contractAddress";

function connectContract() {
  const contractAddress = address; // updates everytime deloy-simple is ran
  console.log("Contract Address: ", address);
  const contractABI = abiJSON;
  console.log("ABI: " + contractABI);
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
