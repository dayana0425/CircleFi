// Check if the user is already a holder of the NFT
// If not, mint NFT 
// If yes, update NFT metadata

import "dotenv/config";
import { ethers } from "hardhat";
import { CircleNFT } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const BACKUP_NFT_ADDRESS = "0xEf1F17E4e79a7c3Fa2f5B1a0823522505F839cA0";

async function blah() {
    // Get signer
    const signer = (await ethers.getSigners())[0];

    // Finding relevant NFT smart contract
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS ? process.env.NFT_CONTRACT_ADDRESS : BACKUP_NFT_ADDRESS;
    console.log(`Connecting to NFT smart contract at address: ${nftAddress}`);
    const CircleNFTContract = await ethers.getContractFactory("CircleNFT");
    const nftContract = await CircleNFTContract.attach(nftAddress) as CircleNFT;
    console.log(`Successfully identified CircleNFT at address ${nftAddress}`);

    console.log("Got here");

    const tokenURI = await nftContract.tokenURI(1);
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
