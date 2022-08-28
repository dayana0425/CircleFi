import { IMAGE_MAP, MetadataResponse, Level, BEGINNER_DATA, INTERMEDIATE_DATA, EXPERT_DATA } from "../../types/metadataTypes";

const defaultURI = "https://ipfs.io/ipfs/bafkreih4wcbrrauh5qpyhijmgp5mbpvi4wqoqmdxzhmzs4ukh65mo5i3dq";

export function generateNFTMetadata(numCompletedCircles: number, nftId: number) {
    if (numCompletedCircles <= 0) {
        throw new Error("The number of completed Circle rounds must be at least 1")
    }

    console.log(`Creating metadata for user who has completed ${numCompletedCircles} circle rounds with NFT ID ${nftId}`);

    let level = determineLevel(numCompletedCircles);
    let levelData = IMAGE_MAP.get(level);
    let imageURI = levelData ? levelData.uri : defaultURI;

    const finalMetadata: MetadataResponse =
    {
        id: nftId,
        name: `CircleBadgeNFT #${nftId}`,
        description: "An NFT commemorating your achievements completing full Circle rounds.",
        image: imageURI,
        attributes: [
            {
                trait_type: "NumCompletedCircles",
                value: numCompletedCircles,
            },
            {
                trait_type: "Level",
                value: level,
            },
        ],
    };

    console.log(`Final metadata has level ${level} and imageURI ${imageURI}`);

    return finalMetadata;
}

export function determineLevel(numCompletedCircles: number): Level {
    if (numCompletedCircles <= BEGINNER_DATA.max) {
        return Level.Beginner;
    } else if (numCompletedCircles <= INTERMEDIATE_DATA.max) {
        return Level.Intermediate
    } else if (numCompletedCircles < EXPERT_DATA.max) {
        return Level.Expert;
    } else {
        return Level.Pro;
    }
}
