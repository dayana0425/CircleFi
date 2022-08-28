import { connect } from "@tableland/sdk";
import { Wallet, utils } from "ethers";
import "dotenv/config";
import { generateNFTMetadata } from "./tables/generateMetadata";
import { MetadataResponse } from "../types/metadataTypes";
import { setupProvider } from "../utils/providerUtils";

const CHAIN = "ethereum-goerli";

export async function incrementRoundsForExistingUser(signer: Wallet, nftId: number, mainTableName: string, attributesTableName: string) {
    const network = process.env.NETWORK;
    const tableland = await connect({ signer, chain: CHAIN });

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
    const result = await incrementRoundsForExistingUser(signer, 0, "table_nft_main_5_508", "table_nft_attributes_5_509");
}
