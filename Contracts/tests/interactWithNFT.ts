import { ethers } from "ethers";
import "dotenv/config";
import * as CircleFiNFTJson from "../artifacts/contracts/CircleFiNFT.sol/CircleFiNFT.json";
import { setupProvider } from "../scripts/utils/providerUtils";
import { CircleFiNFT } from "../typechain";
import { createTables } from "../scripts/nftBadge/tables/createTables";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "0x8fba93C82d65fC326805Df77788F20779f2a11be";

// Set the Tableand gateway as the `baseURI` where a `tokenId` will get appended upon `tokenURI` calls
// Note that `mode=list` will format the metadata per the ERC721 st4andard
const contractAddress = "0x25a71c3e786AC1D05194ccb7DEe0c1827553F10b";

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

    const nftContract = new ethers.Contract(contractAddress, CircleFiNFTJson.abi, signer);
    const publishNewData = true;
    const getTokenURI = true;

    if (publishNewData) {
        const beforeRoundCount = await nftContract.getRoundCountForUser(wallet.address);
        console.log(`Current round count: ${beforeRoundCount}`);
        const updateTx = await nftContract.mintOrUpdateMetadata(wallet.address);
        await updateTx.wait();
        const afterRoundCount = await nftContract.getRoundCountForUser(wallet.address);
        console.log(`Current round count: ${afterRoundCount}`);
    } else if (getTokenURI) {
        const tokenURI = await nftContract.tokenURI(0);
        console.log(`Token URI: ${tokenURI}`);
    } else {
        const tableName = await nftContract.publishToTableland();
        const value = await tableName.wait();
        console.log(value);
    }

/*     let blah = await nftContract.getTestQuery(1);
    console.log(blah);
    blah = await nftContract.getTestQuery(5);
    console.log(blah);
    blah = await nftContract.getTestQuery(15);
    console.log(blah);
    blah = await nftContract.getTestQuery(25);
    console.log(blah); */
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});