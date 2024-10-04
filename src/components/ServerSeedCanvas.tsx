import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

import { SeedImageData } from './SeedCanvas/types';
import layers from '@/data/layers.json';
import fg_genes from '@/data/fg_genes.json';
import { sprite_data } from '@/data/sprite_data';

function seed_id_to_parents(token_id: number) {
  return [token_id >> 16, token_id % 2 ** 16];
}

async function images_from_seed_id(seed_id: number) {
  let [progenitor_token_id, donor_token_id] = seed_id_to_parents(seed_id);

  const progenitor_genes = fg_genes[progenitor_token_id];
  const donor_genes = fg_genes[donor_token_id];

  let images = [];
  let layer_counter = 0;
  for (let layer of layers) {
    let gene = layer.gene;
    let blend_mode = layer.blend_mode;
    let rotation_gene = layer.rotation_gene;
    let rotation = 0;

    if (gene >= 0) {
      if (gene == 0) {
        gene = (progenitor_token_id % 40 + donor_token_id % 60) % 7;
      } else if (gene == 1) {
        gene = (progenitor_token_id % 12 + donor_token_id % 10) % 10;
      } else if (gene == 34) {
        gene = (progenitor_token_id % 100 + donor_token_id % 100) % 6;
      } else if (gene == 35) {
        gene = (progenitor_token_id % 52 + donor_token_id % 2) % 6;
      } else if (gene % 2 == 0) {
        gene = donor_genes[gene];
      } else {
        gene = progenitor_genes[gene];
      }
    }

    if (rotation_gene >= 0) {
      if (rotation_gene == 0) {
        rotation_gene = (progenitor_token_id % 40 + donor_token_id % 60) % 7;
      } else if (rotation_gene == 1) {
        rotation_gene = (progenitor_token_id % 12 + donor_token_id % 10) % 10;
      } else if (rotation_gene == 34) {
        rotation_gene = (progenitor_token_id % 100 + donor_token_id % 100) % 6;
      } else if (rotation_gene == 35) {
        rotation_gene = (progenitor_token_id % 52 + donor_token_id % 2) % 6;
      } else if (rotation_gene % 2 == 0) {
        rotation_gene = donor_genes[rotation_gene];
      } else {
        rotation_gene = progenitor_genes[rotation_gene];
      }
    }

    if (gene >= 0) {
      if (rotation_gene >= 0) {
        if (rotation_gene % 2 == 0) {
          rotation = donor_genes[rotation_gene] * 60;
        } else {
          rotation = progenitor_genes[rotation_gene] * 60;
        }
      }

      let url = `${layer_counter}/${gene}.${layer_counter == 0 || blend_mode == 'multiply' ? 'jpg' : 'png'}`;
      images.push({ url: url, blendMode: blend_mode, rotation: rotation } as SeedImageData);
    }
    layer_counter += 1;
  }

  return images;
}

async function generateSeedImageWithSharp(images: SeedImageData[], jpgSpriteSheet: Buffer, pngSpriteSheet: Buffer): Promise<Buffer> {
  const canvas = sharp({
    create: {
      width: 500,
      height: 500,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  for (let image of images) {
    let spriteInfo = sprite_data[image.url];
    if (spriteInfo && spriteInfo.xy && spriteInfo.bb) {
      let [sx, sy] = spriteInfo.xy;
      let [left, upper, right, lower] = spriteInfo.bb;
      let sWidth = right - left;
      let sHeight = lower - upper;

      const spriteSheet = image.url.split('.')[1] === 'jpg' ? jpgSpriteSheet : pngSpriteSheet;
      
      const extractedImage = await sharp(spriteSheet)
        .extract({ left: sx, top: sy, width: sWidth, height: sHeight })
        .toBuffer();

      canvas.composite([{
        input: extractedImage,
        top: upper,
        left: left,
        blend: image.blendMode === 'multiply' ? 'multiply' : 'over'
      }]);
    }
  }

  return canvas.png().toBuffer();
}

export async function generateSeedImage(seedId: number): Promise<Buffer> {
  if (seedId > 655370000) {
    const response = await fetch(`https://nftstorage.link/ipfs/bafybeie7xdbktqjltxy3pgxwhurak6txhl3bd5yvjl7dbkdwwiojiapxn4/${seedId}.jpg`);
    return Buffer.from(await response.arrayBuffer());
  } else {
    const jpgSpriteSheet = await fs.readFile(path.join(process.cwd(), 'public', 'seed_parts', 'sprite_sheet.jpg'));
    const pngSpriteSheet = await fs.readFile(path.join(process.cwd(), 'public', 'seed_parts', 'sprite_sheet.png'));
    
    const images = await images_from_seed_id(seedId);
    return generateSeedImageWithSharp(images, jpgSpriteSheet, pngSpriteSheet);
  }
}