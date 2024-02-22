
import fg_genes from '@/data/fg_genes';
import * as THREE from 'three';

function seed_id_to_parents(token_id: number) {
    return [token_id >> 16, token_id % 2 ** 16]
}

function generate_purse_textures(purse: Purse) {
    
}

function assign_seed_textures(purse: Purse) {
    const geometry = new THREE.SphereGeometry(10, 20, 20);

    for (let i = 0; i < purse.seeds.length; i++) {
        const seed = purse.seeds[i];
        const [progenitor, donor] = seed_id_to_parents(seed.data?.i || 0);
        const background_color_gene = fg_genes[donor][16];
        const color_gene = fg_genes[donor][20];
        const texture_gene = fg_genes[progenitor][3];

        if (seed.data && seed.data.d) {
            seed.texture = purse.textures[texture_gene];
        }
    }

    geometry.dispose();
}

function generate_seed_mesh(seed: Seed, geometry?: THREE.SphereGeometry, texture?: THREE.Texture) {
    let dispose_geometry_afterwards = false;
    if (!geometry) {
        dispose_geometry_afterwards = true;
        geometry = new THREE.SphereGeometry(10, 20, 20);
    }
    var material = new THREE.MeshLambertMaterial({
        color: seed.background_color || 0x00ff00,
    });
    var mesh = new THREE.Mesh(geometry, material);
    if (dispose_geometry_afterwards) {
        geometry.dispose();
    }
    material.dispose();
    return mesh;
}