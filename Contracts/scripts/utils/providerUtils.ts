import { ethers } from "ethers";

export function setupProvider() {
    const infuraOptions = process.env.INFURA_API_KEY
        ? process.env.INFURA_API_SECRET
        ? {
            projectId: process.env.INFURA_API_KEY,
            projectSecret: process.env.INFURA_API_SECRET,
        }
        : process.env.INFURA_API_KEY
        : "";
    const options = {
        alchemy: process.env.ALCHEMY_API_KEY,
        infura: infuraOptions,
    };
    const provider = ethers.providers.getDefaultProvider(process.env.NETWORK, options);
    return provider;
}