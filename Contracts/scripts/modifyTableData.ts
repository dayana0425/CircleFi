import { Wallet } from "ethers";
import { generateNFTMetadata } from "./generateMetadata";
import { MetadataResponse } from "./types/metadataTypes";

import { connect } from "@tableland/sdk";

const CHAIN = "ethereum-goerli";

// 1. Push new statements to table
export async function pushUserToTable(signer: Wallet, completedCircles: number, nftId: number, mainTable: string, attributesTable: string) {
    const network = process.env.NETWORK;
	console.log(`\nDeploying to network '${network}' with account ${signer.address}`);
	// Connect to Tableland
	const tableland = await connect({ signer, chain: CHAIN });

    // Prepare the metadata (handles all of the IPFS-related actions & JSON parsing).
	const metadata: MetadataResponse = await generateNFTMetadata(completedCircles, nftId);
    // Destructure the metadata values from the passed object
    const { id, name, description, image, attributes } = metadata;
    // INSERT statement for a 'main' table that includes some shared data across any NFT
    // Schema: id int, name text, description text, image text
    let mainTableStatement = `INSERT INTO ${mainTable} (id, name, description, image) VALUES (${id}, '${name}', '${description}', '${image}');`;
    // Iterate through the attributes and create an INSERT statment for each value, pushed to `attributesTableStatements`
    const attributesTableStatements = []
    for await (let attribute of attributes) {
        // Get the attirbutes trait_type & value;
        const { trait_type, value } = attribute;
        // INSERT statement for a separate 'attributes' table that holds attribute data, keyed by the NFT tokenId
        // Schema: id int, trait_type text, value text
        const attributesStatement = `INSERT INTO ${attributesTable} (main_id, trait_type, value) VALUES (${id}, '${trait_type}', '${value}');`;
        attributesTableStatements.push(attributesStatement);
    }

    // Prepare the SQL INSERT statements, which pass the table names to help prepare the statements
	// It returns an object with keys `main` (a single statement) and `attributes` (an array of statements)
	// That is, many `attributes` can be inserted for every 1 entry/row in `main`
    const statement = {
        main: mainTableStatement,
        attributes: attributesTableStatements,
    };
	// Insert metadata into both the 'main' and 'attributes' tables, before smart contract deployment
	console.log(`\nWriting metadata to tables...`)
    // Call `write` with both INSERT statements; optionally, log it to show some SQL queries
    // Use `receipt` to make sure everything worked as expected
    let { hash: mainWriteTx } = await tableland.write(statement.main)
	let receipt = await tableland.receipt(mainWriteTx)
    if (receipt) {
        console.log(`${mainTable} table: ${statement.main}`)
    } else {
        throw new Error(`Write table error: could not get '${mainTable}' transaction receipt: ${mainWriteTx}`)
    }
    // Recall that `attributes` is an array of SQL statements for each `trait_type` and `value` for a `tokenId`
    for await (let attribute of statement.attributes) {
        let { hash: attrWriteTx } = await tableland.write(attribute)
        receipt = await tableland.receipt(attrWriteTx)
        if (receipt) {
            console.log(`${attributesTable} table: ${attribute}`)
        } else {
            throw new Error(`Write table error: could not get '${attributesTable}' transaction receipt: ${attrWriteTx}`)
        }
    }
}

// 2. Update existing statements in table