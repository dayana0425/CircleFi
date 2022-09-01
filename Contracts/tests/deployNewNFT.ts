import { ethers } from "ethers";
import "dotenv/config";
import * as CircleFiNFTJson from "../artifacts/contracts/CircleFiNFT.sol/CircleFiNFT.json";
import { setupProvider } from "../scripts/utils/providerUtils";
import { CircleFiNFT } from "../typechain";
import { createTables } from "../scripts/nftBadge/tables/createTables";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

// Set the Tableand gateway as the `baseURI` where a `tokenId` will get appended upon `tokenURI` calls
// Note that `mode=list` will format the metadata per the ERC721 standard
const BASE_URI = `https://testnet.tableland.network/query?mode=list&s=`;

const REGISTRY = "0xDA8EA22d092307874f30A1F277D1388dca0BA97a";
const MAIN_TABLE_PREFIX = "table_nft_main";
const ATTRIBUTES_TABLE_PREFIX = "table_nft_attributes";

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
    // const { mainName, attributesName } = await createTables(signer);
    // console.log(`Main name: ${mainName}; attributes name: ${attributesName}`);
    
    // Creating contract factory
    const nftContractFactory = new ethers.ContractFactory(
        CircleFiNFTJson.abi,
        CircleFiNFTJson.bytecode,
        signer
    );
    
    console.log(`Deploying CircleFiNFT contract`);
    const nftContract: CircleFiNFT = await nftContractFactory.deploy(
        REGISTRY,
        BASE_URI,
        MAIN_TABLE_PREFIX,
        ATTRIBUTES_TABLE_PREFIX
    ) as CircleFiNFT;
    console.log("Awaiting confirmations");
    await nftContract.deployed();
    console.log("Completed");
    console.log(`Contract deployed at ${nftContract.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});