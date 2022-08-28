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
export const BEGINNER_DATA: MetadataStruct = { uri: "https://demo.storj-ipfs.com/ipfs/bafkreih4wcbrrauh5qpyhijmgp5mbpvi4wqoqmdxzhmzs4ukh65mo5i3dq", min: 1, max: 3};
export const INTERMEDIATE_DATA: MetadataStruct = { uri: "https://demo.storj-ipfs.com/ipfs/bafkreifuhzed2lssxdb4fvxt3zdfep56qxhy4tj2m6q2pjplsdkrbbc7uq", min: 4, max: 10};
export const EXPERT_DATA: MetadataStruct = { uri: "https://demo.storj-ipfs.com/ipfs/bafkreigpbzsiel7och7s5unwgfkkouiz4tr55sapemzle6xefc5tq5msge", min: 11, max: 20};
export const PRO_DATA: MetadataStruct = { uri: "https://demo.storj-ipfs.com/ipfs/bafkreidugmaqnvespj5tve2rb4hxnr2h7fazhqeklsghjlsurx3h5q43gi", min: 21, max: Number.MAX_SAFE_INTEGER};

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
    image: any,
    attributes: Attribute[];
}
