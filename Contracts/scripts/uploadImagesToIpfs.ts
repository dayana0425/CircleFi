import { NFTStorage, File } from 'nft.storage';
import mime from 'mime';
import fs from 'fs';
import path from 'path';
const dotenv = require("dotenv");
dotenv.config();

// The NFT.Storage API token, passed to `NFTStorage` function as a `token`
const nftStorageApiKey = process.env.NFT_STORAGE_API_KEY;

const IMAGE_DIR: string = "images/badge";
export const IMAGE_NAMES: string[] = ["beginner", "intermediate", "expert", "pro"];

/**
 * Upload the image to IPFS and return its CID.
 * @param {number} id The id of the NFT, matching with the `images` and `metadata` directories.
 * @param {string} imagesDirPath The `path` to the directory of images.
 * @returns {string} Resulting CID from pushing the image to IPFS.
 */
 async function uploadImageToIpfs(id: number, imagePath: string) {
	// Find & load the file from disk
	const image = await fileFromPath(imagePath);
	// Upload to IPFS using NFT Storage
	if (nftStorageApiKey) {
		const storage = new NFTStorage({ token: nftStorageApiKey });
		const imageCid = await storage.storeBlob(image);
		// Return the image's CID
		return imageCid;
	} else {
		throw new Error("NFT Storage API key must be specified in env");
	}
}

/**
 * Helper to retrieve a single file from some path.
 * @param {string} filePath The path of a file to retrieve.
 * @returns {File} A fs File at the specified file path.
 */
 async function fileFromPath(filePath: string) {
	const content = await fs.promises.readFile(filePath);
	const type: string = mime.getType(filePath) ?? "jpeg";
	//const blah = new File("", "test");
	return new File([content], path.basename(filePath), { type })
}

async function processImages() {
    for (let i = 0; i < IMAGE_NAMES.length; i++) {
        const imageName: string = IMAGE_NAMES[i];
        const imagePath = path.join(IMAGE_DIR, `${imageName}.jpeg`);
        const imageCid = await uploadImageToIpfs(i, imagePath);
        
        console.log(`Image with name ${imageName} was uploaded to IPFS with CID ${imageCid}`);
    }
}

processImages();