// Check if the user is already a holder of the NFT
// If not, mint NFT 
// If yes, update NFT metadata

import { BigNumber, ethers } from "ethers";
import "dotenv/config";
import { setupProvider } from "../utils/providerUtils";
import * as CircleNFTJson from "../../artifacts/contracts/CircleNFT.sol/CircleNFT.json";
import { CircleNFT } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const BACKUP_NFT_ADDRESS = "0xEf1F17E4e79a7c3Fa2f5B1a0823522505F839cA0";

async function blah() {
    const wallet =
        process.env.MNEMONIC && process.env.MNEMONIC.length > 0
            ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
            : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
    console.log(`Using address ${wallet.address}`);
    const provider = setupProvider();
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }

    // Finding relevant NFT smart contract
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS ? process.env.NFT_CONTRACT_ADDRESS : BACKUP_NFT_ADDRESS;
    // const nftAddress = "0x022e62b3aeD7dc93A1d33adCfF821E9816544E83";
    console.log(`NFT address: ${nftAddress}`);

    const nftContract: CircleNFT = new ethers.Contract(
        nftAddress,
        CircleNFTJson.abi,
        signer
    ) as CircleNFT;
    console.log("Got here");

    const tokenURI = await nftContract.tokenURI(0);
    console.log(`Token URI: ${tokenURI}`);

    /*     // const userNFTBalance = await nftContract.balanceOf(wallet.address);
        const completedCircles = 1;
        const currTokenId = 1;
        const mainTable = process.env.MAIN_TABLE ? process.env.MAIN_TABLE : "table_nft_main_5_500"
        const attributesTable = process.env.ATTRIBUTES_TABLE ? process.env.ATTRIBUTES_TABLE : "table_nft_attributes_5_501"
        await pushUserToTable(signer, completedCircles, currTokenId, mainTable, attributesTable);
        console.log(`Metadata generated and pushed to table for user with tokenId 0`);
    
        let mintTx = await nftContract.mint();
        await mintTx.wait();
        console.log(`NFT has been successfully minted for user. Tx hash: ${mintTx}`); */
}

blah().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
