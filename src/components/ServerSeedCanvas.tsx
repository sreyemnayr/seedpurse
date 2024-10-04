import { Canvas, CanvasRenderingContext2D, Image, createCanvas, loadImage } from 'canvas';
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

async function drawImagesOnCanvas(canvas: any, images: SeedImageData[], jpgSpriteSheet: any, pngSpriteSheet: any) {
  const ctx = canvas.getContext('2d');

  for (let image of images) {
    let spriteInfo = sprite_data[image.url];
    if (spriteInfo && spriteInfo.xy && spriteInfo.bb) {
      let [sx, sy] = spriteInfo.xy;
      let [left, upper, right, lower] = spriteInfo.bb;
      let sWidth = right - left;
      let sHeight = lower - upper;

      ctx.save();
      ctx.globalCompositeOperation = image.blendMode;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((image.rotation * Math.PI) / 180);

      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      let whichSheet = image.url.split('.')[1] == 'jpg' ? jpgSpriteSheet : pngSpriteSheet;
      ctx.drawImage(whichSheet, sx, sy, sWidth, sHeight, left, upper, sWidth, sHeight);

      ctx.restore();
    }
  }
}

export async function generateSeedImage(seedId: number): Promise<Buffer> {
  const canvas: Canvas = createCanvas(500, 500);
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
  
  if (seedId > 655370000) {
    const seed_img: Image = await loadImage(`https://nftstorage.link/ipfs/bafybeie7xdbktqjltxy3pgxwhurak6txhl3bd5yvjl7dbkdwwiojiapxn4/${seedId}.jpg`);
    ctx.drawImage(seed_img, 0, 0, canvas.width, canvas.height);
  } else {
    const jpgSpriteSheet: Image = await loadImage(path.join(process.cwd(), 'public', 'seed_parts', 'sprite_sheet.jpg'));
    const pngSpriteSheet: Image = await loadImage(path.join(process.cwd(), 'public', 'seed_parts', 'sprite_sheet.png'));
    
    const images = await images_from_seed_id(seedId);
    await drawImagesOnCanvas(canvas, images, jpgSpriteSheet, pngSpriteSheet);
  }

  return canvas.toBuffer('image/png');
}