export enum Level {
    Beginner = 'Beginner',
    Intermediate = 'Intermediate',
    Expert = 'Expert',
    Pro = 'Pro'
}

export interface MetadataStruct {
    uri: string;
    min: number;
    max: number
}
export const BEGINNER_DATA: MetadataStruct = { uri: "https://ipfs.io/ipfs/bafkreidrajeqz2ja2mrjkpyqccysskeyw27nkketa6n3pwjsdp7kxds4x4", min: 1, max: 3 };
export const INTERMEDIATE_DATA: MetadataStruct = { uri: "https://ipfs.io/ipfs/bafkreiacwatbslyi32qv5vbhnro7pinbkfhdcuxqiwnitkzlovuffb42xe", min: 4, max: 10 };
export const EXPERT_DATA: MetadataStruct = { uri: "https://ipfs.io/ipfs/bafkreicystubdzxuw3qm53fhmkx6mrqvfhqemevol3xb5s6kdp4nqy34li", min: 11, max: 20 };
export const PRO_DATA: MetadataStruct = { uri: "https://ipfs.io/ipfs/bafkreidi5wrrzsgwguwmm5udjdo5ah7b3paf6slec2j6g7c6yi643rzm6m", min: 21, max: Number.MAX_SAFE_INTEGER };

export const IMAGE_MAP = new Map<Level, MetadataStruct>([
    [Level.Beginner, BEGINNER_DATA],
    [Level.Intermediate, INTERMEDIATE_DATA],
    [Level.Expert, EXPERT_DATA],
    [Level.Pro, PRO_DATA]
]);

export interface Attribute {
    trait_type: string;
    value: any;
}

export interface MetadataResponse {
    id: number,
    name: string,
    description: string,
    image: string,
    attributes: Attribute[];
}
