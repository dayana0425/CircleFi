// Standard `ethers` import for chain interaction, `network` for logging, and `run` for verifying contracts
import { ethers, Wallet } from "ethers";
// Import Tableland
import { connect } from "@tableland/sdk";
import { setupProvider } from "../../utils/providerUtils";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

const CHAIN = "ethereum-goerli";

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
    ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
    : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = setupProvider();
  const signer = wallet.connect(provider);

  const tableland = await connect({ signer, chain: CHAIN });

  const mainTable = process.env.MAIN_TABLE ? process.env.MAIN_TABLE : "table_nft_main_5_498";
  const attributesTable = process.env.ATTRIBUTES_TABLE ? process.env.ATTRIBUTES_TABLE : "table_nft_attributes_5_499";

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

  ///////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////
  // MODIFY THIS TO YOUR LIKING! Update the attributes table with SQL

/*   const updateTable = await tableland.write(
    //`UPDATE ${attributesTable} SET value = 'Tequila on the rocks!' WHERE main_id = 0 AND trait_type = 'DrinkName'`
    `UPDATE ${mainTable} SET image = 'https://demo.storj-ipfs.com/ipfs/Qmcd7eUxGLerxoXePLM43Vj4TSxYh6HqHCgDa7bfeLS9AD' WHERE id = 0;`
  );
  console.log(updateTable); */

  ///////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });