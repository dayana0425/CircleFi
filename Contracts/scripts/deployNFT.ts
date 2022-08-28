import { ethers } from "ethers";
import "dotenv/config";
import * as CircleNFTJson from "../artifacts/contracts/CircleNFT.sol/CircleNFT.json";
import { setupProvider } from "./utils/providerUtils";
import { CircleNFT } from "../typechain";
import { createTables } from "./createTables";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

// Set the Tableand gateway as the `baseURI` where a `tokenId` will get appended upon `tokenURI` calls
// Note that `mode=list` will format the metadata per the ERC721 standard
const BASE_URI = `https://testnet.tableland.network/query?mode=list&s=`;

async function main() {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
    console.log(`Using address ${wallet.address}`);
    const provider = setupProvider();
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance: ${balance}`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    // Deploying metadata tables to Tableland
    const { mainName, attributesName } = await createTables(signer);
    console.log(`Main name: ${mainName}; attributes name: ${attributesName}`);
    
    // Creating contract factory
    const nftContractFactory = new ethers.ContractFactory(
        CircleNFTJson.abi,
        CircleNFTJson.bytecode,
        signer
    );
    
    console.log(`Deploying CircleNFT contract`);
    const nftContract: CircleNFT = await nftContractFactory.deploy(
        BASE_URI,
        mainName,
        attributesName
    ) as CircleNFT;
    console.log("Awaiting confirmations");
    await nftContract.deployed();
    console.log("Completed");
    console.log(`Contract deployed at ${nftContract.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});