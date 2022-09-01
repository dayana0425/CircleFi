import { utils, Wallet } from "ethers";
import { generateNFTMetadata } from "./generateMetadata";
import { MetadataResponse } from "../../types/metadataTypes";

import { connect, Connection } from "@tableland/sdk";
import { setupProvider } from "../../utils/providerUtils";
import "dotenv/config";
import { ethers } from "hardhat";

const CHAIN = "ethereum-goerli";

// 1. Push new statements to table
export async function pushUserToTable(completedCircles: number, nftId: number, mainTableName: string, attributesTableName: string) {
    // Connect to Tableland
    const [signer] = await ethers.getSigners();
    const tableland = await connect({ signer, chain: CHAIN });

    printCurrentTables(tableland, mainTableName, attributesTableName);

    // Prepare the metadata (handles all of the IPFS-related actions & JSON parsing).
    const metadata: MetadataResponse = await generateNFTMetadata(completedCircles, nftId);

    console.log("Generating SQL statements for table updates.");
    // Destructure the metadata values from the passed object
    const { id, name, description, image, attributes } = metadata;
    // INSERT statement for a 'main' table that includes some shared data across any NFT
    // Schema: id int, name text, description text, image text
    let mainTableStatement = `INSERT INTO ${mainTableName} (id, name, description, image) VALUES (${id}, '${name}', '${description}', '${image}');`;
    // Iterate through the attributes and create an INSERT statment for each value, pushed to `attributesTableStatements`
    const attributesTableStatements = []
    for await (let attribute of attributes) {
        // Get the attirbutes trait_type & value;
        const { trait_type, value } = attribute;
        // INSERT statement for a separate 'attributes' table that holds attribute data, keyed by the NFT tokenId
        // Schema: id int, trait_type text, value text
        const attributesStatement = `INSERT INTO ${attributesTableName} (main_id, trait_type, value) VALUES (${id}, '${trait_type}', '${value}');`;
        attributesTableStatements.push(attributesStatement);
    }
    console.log("Finished generating SQL statements for table updates.");

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
    let { hash: mainWriteTx } = await tableland.write(statement.main);
    let receipt = await tableland.receipt(mainWriteTx);
    if (receipt) {
        console.log(`${mainTableName} table: ${statement.main}`);
    } else {
        throw new Error(`Write table error: could not get '${mainTableName}' transaction receipt: ${mainWriteTx}`);
    }
    // Recall that `attributes` is an array of SQL statements for each `trait_type` and `value` for a `tokenId`
    for await (let attribute of statement.attributes) {
        let { hash: attrWriteTx } = await tableland.write(attribute)
        receipt = await tableland.receipt(attrWriteTx)
        if (receipt) {
            console.log(`${attributesTableName} table: ${attribute}`)
        } else {
            throw new Error(`Write table error: could not get '${attributesTableName}' transaction receipt: ${attrWriteTx}`)
        }
    }
}

export async function incrementRoundsForExistingUser(nftId: number, mainTableName: string, attributesTableName: string) {
    const [signer] = await ethers.getSigners();
    const tableland = await connect({ signer, chain: CHAIN });

    printCurrentTables(tableland, mainTableName, attributesTableName);

    const completedCirclesResult = await tableland.read(
        `SELECT * from ${attributesTableName} WHERE main_id=${nftId} and trait_type='NumCompletedCircles'`
    );
    const completedCircles: number = Number(completedCirclesResult.rows[0][2]) + 1;

    console.log(`User has now completed a total of ${completedCircles} circles. Incrementing completed circle count.`);
    const metadata: MetadataResponse = generateNFTMetadata(completedCircles, nftId);
    console.log(`Updated metadata: ${metadata}`);
    // Destructure the metadata values from the passed object
    const { id, name, description, image, attributes } = metadata;
    // INSERT statement for a 'main' table that includes some shared data across any NFT
    // Schema: id int, name text, description text, image text    
    const mainTableQuery = `UPDATE ${mainTableName} SET image = '${image}' WHERE id = ${id};`;
    console.log(`Generated main table query: ${mainTableQuery}`);

    const attributesTableQueries = [];
    for await (let attribute of attributes) {
        // Get the attirbutes trait_type & value;
        const { trait_type, value } = attribute;
        const updateAttributesStr = `UPDATE ${attributesTableName} SET value = '${value}' WHERE main_id = ${id} AND trait_type = '${trait_type}';`;
        console.log(`Generated attribute update table query: ${updateAttributesStr}`);
        attributesTableQueries.push(updateAttributesStr);
    }

    // Insert metadata into both the 'main' and 'attributes' tables, before smart contract deployment
    console.log(`\nWriting metadata to tables...`)
    // Call `write` with both INSERT statements; optionally, log it to show some SQL queries
    // Use `receipt` to make sure everything worked as expected
    let { hash: mainWriteTx } = await tableland.write(mainTableQuery)
    let receipt = await tableland.receipt(mainWriteTx);
    if (receipt) {
        console.log(`${mainTableName} table: ${receipt}`);
    } else {
        throw new Error(`Write table error: could not get '${mainTableName}' transaction receipt: ${mainWriteTx}`);
    }
    // Recall that `attributes` is an array of SQL statements for each `trait_type` and `value` for a `tokenId`
    for await (let attribute of attributesTableQueries) {
        let { hash: attrWriteTx } = await tableland.write(attribute)
        receipt = await tableland.receipt(attrWriteTx)
        if (receipt) {
            console.log(`${attributesTableName} table: ${receipt}`)
        } else {
            throw new Error(`Write table error: could not get '${attributesTableName}' transaction receipt: ${attrWriteTx}`)
        }
    }
}

async function printCurrentTables(tableland: Connection, mainTableName: string, attributesTableName: string) {
    // Get info for all tables associated with your account
    const tables = await tableland.list();
    console.log(`Tables: ${tables}`);

    // Read all records in the main table
    const { columns: mc, rows: mr } = await tableland.read(
        `SELECT * FROM ${mainTableName}`
    );
    console.log(mc, mr);

    // Read all records in the attributes table
    const { columns: ac, rows: ar } = await tableland.read(
        `SELECT * FROM ${attributesTableName}`
    );
    console.log(ac, ar);
}
