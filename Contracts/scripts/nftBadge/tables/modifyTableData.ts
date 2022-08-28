import { utils, Wallet } from "ethers";
import { generateNFTMetadata } from "./generateMetadata";
import { MetadataResponse } from "../../types/metadataTypes";

import { connect } from "@tableland/sdk";
import { setupProvider } from "../../utils/providerUtils";
import "dotenv/config";

const CHAIN = "ethereum-goerli";

// 1. Push new statements to table
export async function pushUserToTable(signer: Wallet, completedCircles: number, nftId: number, mainTable: string, attributesTable: string) {
    const network = process.env.NETWORK;
    console.log(`\nDeploying to network '${network}' with account ${signer.address}`);
    // Connect to Tableland
    const tableland = await connect({ signer, chain: CHAIN });

    // Prepare the metadata (handles all of the IPFS-related actions & JSON parsing).
    const metadata: MetadataResponse = await generateNFTMetadata(completedCircles, nftId);
    console.log(`Metadata response: ${metadata}`);

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
    let { hash: mainWriteTx } = await tableland.write(statement.main);
    let receipt = await tableland.receipt(mainWriteTx);
    if (receipt) {
        console.log(`${mainTable} table: ${statement.main}`);
    } else {
        throw new Error(`Write table error: could not get '${mainTable}' transaction receipt: ${mainWriteTx}`);
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
export async function incrementRoundsForExistingUser(signer: Wallet, nftId: number, mainTable: string, attributesTable: string) {
    const network = process.env.NETWORK;
    const tableland = await connect({ signer, chain: CHAIN });

    // TODO generate completedCircles: number
    // Get the current completed circles from tableland and increment

    // Get info for all tables associated with your account
    const tables = await tableland.list();
    console.log(tables);

    // Read all records in the main table
    const { columns: mc, rows: mr } = await tableland.read(
        `SELECT * FROM ${mainTable}`
    );
    console.log(mc, mr);

    // Read all records in the attributes table
    const { columns: ac, rows: ar } = await tableland.read(
        `SELECT * FROM ${attributesTable}`
    );
    console.log(ac, ar);

    const completedCirclesResult = await tableland.read(
        `SELECT * from ${attributesTable} WHERE main_id=${nftId} and trait_type='NumCompletedCircles'`
    );
    const completedCircles: number = Number(completedCirclesResult.rows[0][2]) + 1;

    const metadata: MetadataResponse = generateNFTMetadata(completedCircles, nftId);
    console.log(`Metadata response: ${metadata}`);
    // Destructure the metadata values from the passed object
    const { id, name, description, image, attributes } = metadata;
    // INSERT statement for a 'main' table that includes some shared data across any NFT
    // Schema: id int, name text, description text, image text    
    const mainTableQuery = `UPDATE ${mainTable} SET image = '${image}' WHERE id = ${id};`;
    console.log(`Generated main table query: ${mainTableQuery}`);

    const attributesTableQueries = [];
    for await (let attribute of attributes) {
        // Get the attirbutes trait_type & value;
        const { trait_type, value } = attribute;
        const updateAttributesStr = `UPDATE ${attributesTable} SET value = '${value}' WHERE main_id = ${id} AND trait_type = '${trait_type}';`;
        console.log(`Generated attribute update table query: ${updateAttributesStr}`);
        attributesTableQueries.push(updateAttributesStr);
    }

    // Insert metadata into both the 'main' and 'attributes' tables, before smart contract deployment
    console.log(`\nWriting metadata to tables...`)
    // Call `write` with both INSERT statements; optionally, log it to show some SQL queries
    // Use `receipt` to make sure everything worked as expected
    let { hash: mainWriteTx } = await tableland.write(mainTableQuery)
    // let mainWriteTx = await tableland.write(mainTableQuery);
    let receipt = await tableland.receipt(mainWriteTx);
    if (receipt) {
        console.log(`${mainTable} table: ${receipt}`);
    } else {
        throw new Error(`Write table error: could not get '${mainTable}' transaction receipt: ${mainWriteTx}`);
    }
    // Recall that `attributes` is an array of SQL statements for each `trait_type` and `value` for a `tokenId`
    for await (let attribute of attributesTableQueries) {
        let { hash: attrWriteTx } = await tableland.write(attribute)
        receipt = await tableland.receipt(attrWriteTx)
        if (receipt) {
            console.log(`${attributesTable} table: ${receipt}`)
        } else {
            throw new Error(`Write table error: could not get '${attributesTable}' transaction receipt: ${attrWriteTx}`)
        }
    }
}

async function incrementRoundsForExistingUserTest() {
    const wallet = new Wallet(process.env.PRIVATE_KEY ?? "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f");
    console.log(`Using address ${wallet.address}`);
    const provider = setupProvider();
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(utils.formatEther(balanceBN));
    console.log(`Wallet balance: ${balance}`);
    if (balance < 0.01) {
        throw new Error("Not enough ether");
    }
    const result = await incrementRoundsForExistingUser(signer, 0, "table_nft_main_5_504", "table_nft_attributes_5_505");
}

// For testing
/* incrementRoundsForExistingUserTest().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); */