import sharp, { Blend } from 'sharp';
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

  if (!progenitor_genes || !donor_genes) {
    throw new Error(`Invalid seed ID: ${seed_id}`);
  }

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
        gene = donor_genes[gene] ?? 0;
      } else {
        gene = progenitor_genes[gene] ?? 0;
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
        rotation_gene = donor_genes[rotation_gene] ?? 0;
      } else {
        rotation_gene = progenitor_genes[rotation_gene] ?? 0;
      }
    }

    if (gene >= 0) {
      if (rotation_gene >= 0) {
        if (rotation_gene % 2 == 0) {
          rotation = (donor_genes[rotation_gene] ?? 0) * 60;
        } else {
          rotation = (progenitor_genes[rotation_gene] ?? 0) * 60;
        }
      }

      let url = `${layer_counter}/${gene}.${layer_counter == 0 || blend_mode == 'multiply' ? 'jpg' : 'png'}`;
      images.push({ url: url, blendMode: blend_mode, rotation: rotation } as SeedImageData);
    }
    layer_counter += 1;
  }

  return images;
}

async function generateSeedImageWithSharp(
  images: SeedImageData[], 
  jpgSpriteSheet: Buffer, 
  pngSpriteSheet: Buffer, 
  size: number = 500
): Promise<Buffer> {
  const canvasSize = size > 500 ? 2000 : size <= 100 ? 100 : 500;
  const scaleFactor = size > 500 ? 0.25 : size <= 100 ? 5 : 1;
  // const scaleFactor = size === 100 ? 5 : (size === 2000 ? 0.25 : 1);
  
  const baseCanvas = sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const compositeOperations: sharp.OverlayOptions[] = [];

  for (let image of images) {
    let spriteInfo = sprite_data[image.url];
    
    if (spriteInfo && spriteInfo.xy && spriteInfo.bb) {
      let [sx, sy] = spriteInfo.xy.map(coord => Math.round(coord / scaleFactor));
      let [left, upper, right, lower] = spriteInfo.bb.map(coord => Math.round(coord / scaleFactor));
      let sWidth = right - left;
      let sHeight = lower - upper;

      let extractedImage;

      if (canvasSize === 2000) {
        const baseUrl = 'https://jedle42hckslzzfa.public.blob.vercel-storage.com/cropped_seed_parts/';
        const response = await fetch(`${baseUrl}${image.url}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch image for seed ID ${image.url}`);
        }
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        extractedImage = sharp(imageBuffer);
      } else {
        const spriteSheet = image.url.split('.')[1] === 'jpg' ? jpgSpriteSheet : pngSpriteSheet;
        extractedImage = sharp(spriteSheet, { failOnError: false })
          .extract({ left: sx, top: sy, width: sWidth, height: sHeight });
      }

      try {
        if (image.rotation !== 0) {
          const rotationCanvas = sharp({
            create: {
              width: canvasSize,
              height: canvasSize,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
          });

          const composited = await rotationCanvas
            .composite([{
              input: await extractedImage.png().toBuffer(),
              top: upper,
              left: left
            }]).png().toBuffer();

          const placedImage = sharp(composited).rotate(image.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    
          const meta = await sharp(await placedImage.png().toBuffer()).metadata();
          
          const extractedRotatedImage = sharp(await placedImage.png().toBuffer()).extract({ 
            left: Math.round(((meta.width ?? canvasSize) - canvasSize) / 2), 
            top: Math.round(((meta.height ?? canvasSize) - canvasSize) / 2), 
            width: canvasSize, 
            height: canvasSize 
          });

          extractedImage = sharp(await extractedRotatedImage.png().toBuffer());
        
          left = 0;
          upper = 0;
        }

        const layerBuffer = await extractedImage.png().toBuffer();

        compositeOperations.push({
          input: layerBuffer,
          top: upper,
          left: left,
          blend: (image.blendMode === 'multiply' ? 'multiply' : 'over') as Blend
        });
      } catch (error) {
        console.error(`Error processing image ${image.url}:`, error);
      }
    }
  }

  try {
    const compositeImage = await baseCanvas.composite(compositeOperations).png().toBuffer();
    return compositeImage;
  } catch (error) {
    console.error('Error in final composite:', error);
    throw error;
  }
}

export async function generateSeedImage(seedId: number, size: number = 500): Promise<Buffer> {
  if (seedId > 655370000) {
    const response = await fetch(`https://nftstorage.link/ipfs/bafybeie7xdbktqjltxy3pgxwhurak6txhl3bd5yvjl7dbkdwwiojiapxn4/${seedId}.jpg`);
    if (!response.ok) {
      throw new Error(`Failed to fetch image for seed ID ${seedId}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (size !== 2000) {
      return sharp(buffer).resize(size, size).toBuffer();
    }
    return buffer;
  } else {
    try {
      const images = await images_from_seed_id(seedId);
      const suffix = size <= 100 ? '_100' : '';
      const jpgSpriteSheet = size > 500 ? Buffer.alloc(0) : await fs.readFile(path.join(process.cwd(), 'public', 'seed_parts', `sprite_sheet${suffix}.jpg`));
      const pngSpriteSheet = size > 500 ? Buffer.alloc(0) : await fs.readFile(path.join(process.cwd(), 'public', 'seed_parts', `sprite_sheet${suffix}.png`));

      const buffer = await generateSeedImageWithSharp(images, jpgSpriteSheet, pngSpriteSheet, size);

      if ([2000, 500, 100].includes(size)) {
        return buffer;
      } else {
        return sharp(buffer).resize(size, size).toBuffer();
      }
      
      
    } catch (error) {
      console.error(`Error generating seed image for ID ${seedId}:`, error);
      throw error;
    }
  }
}