// Check if the user is already a holder of the NFT
// If not, mint NFT 
// If yes, update NFT metadata

import { BigNumber, Contract, ethers } from "ethers";
import "dotenv/config";
import { setupProvider } from "../utils/providerUtils";
import * as CircleNFTJson from "../../artifacts/contracts/CircleNFT.sol/CircleNFT.json";
import { determineLevel, generateNFTMetadata } from "./tables/generateMetadata";
import { IMAGE_MAP, Level } from "../types/metadataTypes";
import { incrementRoundsForExistingUser, pushUserToTable } from "./tables/modifyTableData";
import { CircleNFT } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const BACKUP_NFT_ADDRESS = "0xEf1F17E4e79a7c3Fa2f5B1a0823522505F839cA0";

async function mintOrUpdateNFT() {
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
    console.log(`NFT address: ${nftAddress}`);

    const nftContract: CircleNFT = new Contract(
        nftAddress,
        CircleNFTJson.abi,
        signer
    ) as CircleNFT;

    // Determine whether user is a holder of this NFT. If so, they have already completed previous rounds
    const userNFTBalance: BigNumber = await nftContract.balanceOf(wallet.address);
    console.log(`User NFT balance: ${userNFTBalance}`);
    const currTokenId: BigNumber = await nftContract.tokenIdCounter();
    console.log(`Current tokenId: ${currTokenId}`);

    const mainTable: string = await nftContract.mainTable();
    // console.log(`Main table name: ${mainTable}`);
    const attributesTable: string = await nftContract.attributesTable();
    // console.log(`Attributes table name: ${attributesTable}`);

    if (userNFTBalance.toNumber() > 0) {
        // If the user already holds the NFT, no need to mint. Update metadata.
        // TODO fill this in to just update metadata rather than mint
        console.log("User already holds this NFT. No need to mint.");

        console.log("Updating Tableland metadata for user");
        const response = await incrementRoundsForExistingUser(signer, currTokenId.toNumber(), mainTable, attributesTable);
        console.log(`Response: ${response}`);
        console.log(`Metadata generated and pushed to table for user with tokenId ${currTokenId}. Changes will be reflected shortly.`);
    } else {
        // If the user doesn't hold the NFT yet, mint the inital version of the NFT
        console.log("User doesn't have any of this NFT. Need to mint beginner tier NFT.");

        const response = await pushUserToTable(signer, 1, currTokenId.toNumber(), mainTable, attributesTable);
        console.log(`Response: ${response}`);
        console.log(`Metadata generated and pushed to table for user with tokenId ${currTokenId}`);
        
        let mintTx = await nftContract.mint();
        await mintTx.wait();
        console.log("NFT has been successfully minted for user.");
    }



    // const userNFTBalance = await nftContract.balanceOf(wallet.address);
/*     const completedCircles = 1;
    const currTokenId = 1;
    const mainTable = process.env.MAIN_TABLE ? process.env.MAIN_TABLE : "table_nft_main_5_500"
    const attributesTable = process.env.ATTRIBUTES_TABLE ? process.env.ATTRIBUTES_TABLE : "table_nft_attributes_5_501"
    await pushUserToTable(signer, completedCircles, currTokenId, mainTable, attributesTable);
    console.log(`Metadata generated and pushed to table for user with tokenId 0`);

    let mintTx = await nftContract.mint();
    await mintTx.wait();
    console.log(`NFT has been successfully minted for user. Tx hash: ${mintTx}`); */
    // Determine whether user is a holder of this NFT. If so, they have already completed previous rounds
    /*     const userNFTBalance = await nftContract.balanceOf(wallet.address);
        console.log(`User NFT balance: ${userNFTBalance}`);
        // sleep(1000);
    
        // Determine ID of the last created token
        const currTokenId = await nftContract.tokenIdCounter(); */
    /*     console.log(`Current tokenId: ${currTokenId}`); */
    /*     sleep(1000);
        const mainTable: string = await nftContract.mainTable();
        console.log(`Main table name: ${mainTable}`);
        sleep(3000);
        const attributesTable: string = await nftContract.attributesTable();
        console.log(`Attributes table name: ${attributesTable}`); */

    /*     if (userNFTBalance > BigNumber.from(0)) {
            // If the user already holds the NFT, no need to mint. Update metadata.
    
    
    
            // TODO fill this in to just update metadata rather than mint
            console.log("user holds this NFT");
        } else {
            // If the user doesn't hold the NFT yet, mint the inital version of the NFT
            console.log("User doesn't have any of this NFT. Need to mint beginner tier NFT.");
    
            const mainTable: string = await nftContract.mainTable();
            console.log(`Main table name: ${mainTable}`);
            const attributesTable: string = await nftContract.attributesTable();
            console.log(`Attributes table name: ${attributesTable}`);
    
            const response = pushUserToTable(signer, 1, currTokenId.toNumber(), mainTable, attributesTable);
            console.log(`Metadata generated and pushed to table for user with tokenId ${currTokenId}`);
            
            let mintTx = await nftContract.mint();
            await mintTx.wait();
            console.log("NFT has been successfully minted for user.");
        } */
}

async function testNFTMinting() {
    await mintOrUpdateNFT();
}

testNFTMinting();

/* mintOrUpdateNFT().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
 */