import { ethers } from "hardhat";
import "dotenv/config";
import { incrementRoundsForExistingUser, pushUserToTable } from "./tables/modifyTableData";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const BACKUP_NFT_ADDRESS = "0xEf1F17E4e79a7c3Fa2f5B1a0823522505F839cA0";

async function mintOrUpdateNFT() {
    // Get signer
    const signer = (await ethers.getSigners())[0];

    // Finding relevant NFT smart contract
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS ? process.env.NFT_CONTRACT_ADDRESS : BACKUP_NFT_ADDRESS;
    console.log(`Connecting to NFT smart contract at address: ${nftAddress}`);
    const CircleNFTContract = await ethers.getContractFactory("CircleNFT");
    const nftContract = await CircleNFTContract.attach(nftAddress) as CircleNFT;
    console.log(`Successfully identified CircleNFT at address ${nftAddress}`);
    
    // Determine whether user is a holder of this NFT. If so, they have already completed previous rounds
    const userNFTBalance = await nftContract.balanceOf(signer.address);
    console.log(`User NFT balance: ${userNFTBalance}`);
    console.log(`User currently ${userNFTBalance.toNumber() == 0 ? "does not hold" : "holds"} a CircleNFT badge.`);

    const mainTable: string = await nftContract.mainTable();
    console.log(`Main NFT metadata table name: ${mainTable}`);
    const attributesTable: string = await nftContract.attributesTable();
    console.log(`NFT attributes table name: ${attributesTable}`);
    const maxTokenId = await nftContract.tokenIdCounter();
    console.log(`Current total number of tokens: ${maxTokenId}`);

    if (userNFTBalance.toNumber() > 0) {
        // Identify the token ID held by the user
        let tokenId = -1;        
        for (let i = 0; i < maxTokenId.toNumber(); i++) {
            const owner = await nftContract.ownerOf(i);
            console.log(`Owner of NFT at tokenId ${i} is ${owner}`);
            
            if (owner == signer.address) {
                tokenId = i;
            }
        }

        if (tokenId == -1) {
            throw new Error("User owns NFT but we couldn't identify the tokenId they hold.");
        }

        // If the user already holds the NFT, no need to mint. Update Tableland to evolve the user's NFT.
        console.log("User already holds this NFT. No need to mint.");

        console.log("Updating Tableland metadata for user");
        await incrementRoundsForExistingUser(tokenId, mainTable, attributesTable);
        console.log(`Metadata generated and pushed to table for user with tokenId ${tokenId}. Changes will be reflected shortly.`);
    } else {

        // If the user doesn't hold the NFT yet, mint the inital version of the NFT
        console.log(`User doesn't have any of this NFT. Need to mint beginner tier NFT at tokenId ${maxTokenId.toNumber()}.`);

        await pushUserToTable(1, maxTokenId.toNumber(), mainTable, attributesTable);
        console.log(`Metadata generated and pushed to table for user with tokenId ${maxTokenId}`);

        // let mintTx = await nftContract.mint();
        // await mintTx.wait();
        console.log("NFT has been successfully minted for user.");
    }
}

mintOrUpdateNFT().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
