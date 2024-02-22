

interface GeneRarity {
    g: string; // gene
    r: number; // rarity
}

interface DNATextures {
    [key: number]: THREE.Texture;
}

interface Purse {
    wallet: string;
    seeds: Seed[];
    textures: DNATextures;

}

interface SeedData {
    _id?: string; // id (database)
    i: number; // token_id
    d?: string; // dna
    r?: number; // seed_rarity
    d_r?: GeneRarity[]; // dna_rarity
    b?: number; // harvested_by
    t?: number; // harvested_date
    n?: boolean; // new
    p?: boolean; // protected
}

interface Seed {
    data?: SeedData;
    background_color?: number;
    color?: number;
    texture?: THREE.Texture;
    mesh?: THREE.Mesh;

}