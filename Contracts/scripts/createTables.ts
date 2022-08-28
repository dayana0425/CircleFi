// Standard `ethers` import for chain interaction, `network` for logging, and `run` for verifying contracts
import { ethers, Wallet } from "ethers";
// The script required to upload metadata to IPFS
import { prepareSqlForTwoTables } from "./prepareSQL";
// Import Tableland
import { connect } from "@tableland/sdk";
import { setupProvider } from "./utils/providerUtils";
  
const CHAIN = "ethereum-goerli";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

/**
 * Primary script to deploy the NFT, first pushing images to IPFS and saving the CIDs to a metadata object.
 * Then, creating both a 'main' and 'attributes' metadata table to INSERT metadata into for each NFT token.
 */
export async function createTables(signer: Wallet) {
    const network = process.env.NETWORK;
	console.log(`\nDeploying to network '${network}' with account ${signer.address}`);
	// Connect to Tableland
	const tableland = await connect({ signer, chain: CHAIN });
	// Define the 'main' table's schema as well as the 'attributes' table; a primary key should exist
	// Recall that declaring a primary key must have a unique combination of values in its primary key columns
	const mainSchema = `id int primary key, name text, description text, image text`;
	// Should have one `main` row (a token) to many `attributes`, so no need to introduce a primary key constraint
	const attributesSchema = `main_id int not null, trait_type text not null, value text`;
	// Define the (optional) prefix, noting the main & attributes tables
	const mainPrefix = "table_nft_main";
	const attributesPrefix = "table_nft_attributes";
    
    console.log(`Creating tables with prefixes ${mainPrefix} and ${attributesPrefix}`);
    
	// Create the main table and retrieve its returned `name` and on-chain tx as `txnHash`
	const { name: mainName, txnHash: mainTxnHash } = await tableland.create(mainSchema, { prefix: mainPrefix });
    
	// Wait for the main table to be "officially" created (i.e., tx is included in a block)
	// If you do not, you could be later be inserting into a non-existent table
	let receipt = await tableland.receipt(mainTxnHash);
	if (receipt) {
		console.log(`Table '${mainName}' has been created at tx '${mainTxnHash}'`);
	} else {
		throw new Error(`Create table error: could not get '${mainName}' transaction receipt: ${mainTxnHash}`);
	}

	// Create the attributes table and retrieve its returned `name` and on-chain tx as `txnHash`
	const { name: attributesName, txnHash: attributesTxnHash } = await tableland.create(attributesSchema, {
		prefix: attributesPrefix,
	})
	// Wait for the attributes table to be "officially" created
	// If you do not, you could be later be inserting into a non-existent table
	receipt = await tableland.receipt(attributesTxnHash)
	if (receipt) {
		console.log(`Table '${attributesName}' has been created at tx '${attributesTxnHash}'`);
	} else {
		throw new Error(`Create table error: could not get '${attributesName}' transaction receipt: ${attributesTxnHash}`);
	}

    return { mainName: mainName, attributesName: attributesName };
}

// call this function to test this script
async function deployTableTest() {
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

    const result = await createTables(signer);
    console.log(`Main name: ${result.mainName} and attributes name: ${result.attributesName}`);
    
}

/* deployTableTest().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); */
