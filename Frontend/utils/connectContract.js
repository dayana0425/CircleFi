import abiJSON from "../../Contracts/artifacts/contracts/SimpleSavingCircle.sol/SimpleSavingCircle.json";
import { ethers } from "ethers";

function connectContract() {
  const contractAddress = "0x61f452de1cC6d18621261A574272B56d3C2A5907";
  const contractABI = abiJSON.abi;
  console.log(contractABI);
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
