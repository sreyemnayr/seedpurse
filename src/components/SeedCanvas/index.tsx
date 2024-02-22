'use client'
import {useRef, useEffect} from 'react'

import { SeedImageData } from './types';
import layers from '@/data/layers.json'
import fg_genes from '@/data/fg_genes.json'
import { sprite_data } from '@/data/sprite_data'




let pngSpriteSheet = new Image();
pngSpriteSheet.onloadstart = () => {
    console.log('spriteSheet loading');
}
pngSpriteSheet.onload = () => {
    console.log('spriteSheet loaded');
}
pngSpriteSheet.src = './seed_parts/sprite_sheet.png';

let jpgSpriteSheet = new Image();
jpgSpriteSheet.onloadstart = () => {
    console.log('spriteSheet loading');
}
jpgSpriteSheet.onload = () => {
    console.log('spriteSheet loaded');
}
jpgSpriteSheet.src = './seed_parts/sprite_sheet.jpg';


async function drawImagesOnCanvas(canvas: HTMLCanvasElement, images: SeedImageData[]) {
    
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

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
          console.log(whichSheet, image.url.split('.')[1]);
          ctx.drawImage(whichSheet, sx, sy, sWidth, sHeight, left, upper, sWidth, sHeight);
          
          ctx.restore();
        }
      }
    
  }

function seed_id_to_parents(token_id: number) {
    return [token_id >> 16, token_id % 2 ** 16]
}

async function images_from_seed_id(seed_id: number) {
    let [progenitor_token_id, donor_token_id] = seed_id_to_parents(seed_id);
    
    const progenitor_genes = fg_genes[progenitor_token_id];
    const donor_genes = fg_genes[donor_token_id];

    // iterate through the layers array of objects (each one has a 'gene', 'blend_mode', and 'rotation_gene' property)
    // if the gene is an even number, use the donor gene, if it's an odd number, use the donor gene
    // except for genes..
    // 0: (progenitor_token_id % 40 + donor_token_id % 60) % 7
    // 1: (progenitor_token_id % 12 + donor_token_id % 10) % 10
    // 34: (progenitor_token_id % 100 + donor_token_id % 100) % 6
    // 35: (progenitor_token_id % 52 + donor_token_id % 2) % 6

    let images = [];
    let layer_counter = 0;
    for (let layer of layers) {

        let gene = layer.gene;
        let blend_mode = layer.blend_mode;
        let rotation_gene = layer.rotation_gene;
        let rotation = 0;

        if (gene >= 0){
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

        if (rotation_gene >= 0){
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
        
        if (gene >= 0){
            if (rotation_gene >= 0){
                if (rotation_gene % 2 == 0) {
                    rotation = donor_genes[rotation_gene] * 60;
                } else {
                    rotation = progenitor_genes[rotation_gene] * 60;
                }

            }
            
    
            let url = `${layer_counter}/${gene}.${layer_counter == 0 || blend_mode == 'multiply' ? 'jpg' : 'png'}`;
            images.push({url: url, blendMode: blend_mode, rotation: rotation} as SeedImageData);


        }
        layer_counter += 1;
        
    }

    
    return images;
}

export default function SeedCanvas({seedId}: {seedId: number}) {
    const canvasRef = useRef(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas){
            images_from_seed_id(seedId).then(images => {
                drawImagesOnCanvas(canvas, images);
                // drawImagesOnCanvas(images, 'individual');
            }).catch(err => {
              alert("Seed does not exist.");
            });
        }
        
      }, [seedId])

    return (
        <canvas ref={canvasRef} id="canvas" width="500" height="500"></canvas>
    )
}

