import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CircleFiNFT } from "../typechain";

describe ("CircleFiNFT", function () {
    let nftContract: CircleFiNFT;
    let accounts: any[];
    let deployer;

    const BASE_URI = "https://testnet.tableland.network/query?mode=list&s=";
    const MAIN_TABLE = "table_nft_main_5_521";
    const ATTRIBUTES_TABLE = "table_nft_attributes_5_522";
    const REGISTRY = "0xda8ea22d092307874f30a1f277d1388dca0ba97a";

    beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0].address;
        const nftFactory = await ethers.getContractFactory("CircleFiNFT");
        
        nftContract = await nftFactory.deploy(REGISTRY, BASE_URI, MAIN_TABLE, ATTRIBUTES_TABLE);
        await nftContract.deployed();
      });
    
    describe("when the NFT is deployed", function () {
        it("sets the expected baseURI and table names", async function () {
            /* const baseURI = await nftContract.baseURIString();
            const mainTable = await nftContract.mainTableName();
            const attributesTable = await nftContract.attributesTableName();

            expect(baseURI).to.eq(BASE_URI);
            expect(mainTable).to.eq(MAIN_TABLE);
            expect(attributesTable).to.eq(ATTRIBUTES_TABLE); */
        });

        it("sets the initial token count to 0", async function() {
            const tokenCount = await nftContract.getTokenCount();

            expect(tokenCount.toNumber()).to.eq(0);
        });
    });

    describe("when mintAndUpdateMetadata is called", function () {
        it("should mint a new NFT for first time minters", async function() {
            const recipient = accounts[1].address;
            const nftContractConnected = nftContract.connect(recipient);
            const nftBalance = await nftContractConnected.balanceOf(recipient);
            expect(nftBalance.toNumber()).to.eq(0);

            const tx = await nftContract.mintAndUpdateMetadata(recipient);
            const updatedNFTBalance = await nftContractConnected.balanceOf(recipient);
            expect(updatedNFTBalance.toNumber()).to.eq(1);
        });

        it("should not mint a new NFT for users that have already minted", async function() {
            const recipient = accounts[1].address;
            const nftContractConnected = nftContract.connect(recipient);
            const nftBalance = await nftContractConnected.balanceOf(recipient);
            expect(nftBalance.toNumber()).to.eq(0);

            await nftContract.mintAndUpdateMetadata(recipient);
            const updatedNFTBalance = await nftContractConnected.balanceOf(recipient);
            expect(updatedNFTBalance.toNumber()).to.eq(1);

            await nftContract.mintAndUpdateMetadata(recipient);
            const finalUpdatedNFTBalance = await nftContractConnected.balanceOf(recipient);
            expect(finalUpdatedNFTBalance.toNumber()).to.eq(1);
        });

        it("blah", async function () {
            // const blah = nftContract.getAttributesTableId();
            // console.log(blah);
            const blah2 = await nftContract.getMainTableId();
            console.log(blah2);
        });
    });
});