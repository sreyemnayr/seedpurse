'use client'
import { useRef, useEffect, useState, memo } from 'react'

import { SeedImageData } from './types';
import layers from '@/data/layers.json'
import fg_genes from '@/data/fg_genes.json'
import { sprite_data } from '@/data/sprite_data'






async function drawImagesOnCanvas(canvas: HTMLCanvasElement, images: SeedImageData[], jpgSpriteSheet: HTMLImageElement, pngSpriteSheet: HTMLImageElement) {

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

    // console.log(jpgSpriteSheet, pngSpriteSheet);

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
            // console.log(whichSheet, image.url.split('.')[1]);
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

export default function SeedCanvas({ seedId, perRow = 1 }: { seedId: number, perRow?: number }) {
    if (perRow < 1) {
        perRow = 1
    }
    const canvasRef = useRef(null);
    const [pngSpriteSheet, setPngSpriteSheet] = useState<HTMLImageElement>();
    const [jpgSpriteSheet, setJpgSpriteSheet] = useState<HTMLImageElement>();
    const [spritesLoaded, setSpritesLoaded] = useState<number>(0);

    useEffect(() => {

        setPngSpriteSheet(() => {
            const c = new Image()
            c.onload = () => {
                setSpritesLoaded(c => c + 1);
            }
            c.src = '/seed_parts/sprite_sheet.png';
            return c
        })
        setJpgSpriteSheet(() => {
            const c = new Image()
            c.onload = () => {
                setSpritesLoaded(c => c + 1);
            }
            c.src = '/seed_parts/sprite_sheet.jpg';
            return c
        })

    }, [])

    useEffect(() => {

        const canvas: any = canvasRef.current
        if (canvas && canvas instanceof HTMLCanvasElement) {
            if (seedId > 655370000) {
                const ctx: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

                const seed_img = new Image()
                seed_img.onload = () => {
                    ctx.drawImage(seed_img, 0, 0, canvas.width, canvas.height)
                }
                seed_img.src = `https://nftstorage.link/ipfs/bafybeie7xdbktqjltxy3pgxwhurak6txhl3bd5yvjl7dbkdwwiojiapxn4/${seedId}.jpg`
            } else if (spritesLoaded >= 2 && jpgSpriteSheet && pngSpriteSheet) {
                images_from_seed_id(seedId).then(images => {
                    drawImagesOnCanvas(canvas, images, jpgSpriteSheet, pngSpriteSheet);
                    // drawImagesOnCanvas(images, 'individual');
                }).catch(err => {


                    console.log("Seed does not exist", seedId)
                    console.log("Parents", seed_id_to_parents(seedId))
                    alert("Seed does not exist.")
                });
            }
        }

    }, [seedId, spritesLoaded, jpgSpriteSheet, pngSpriteSheet])

    return (
        <canvas ref={canvasRef} id="canvas" width="500" height="500" style={{ height: perRow > 1 ? `${(100 / (perRow)) - (10 / (perRow))}vh` : 'min(90vh, 500px)', maxHeight: `${(100 / (perRow)) - (10 / (perRow))}vw`, maxWidth: `${(100 / (perRow)) - (10 / (perRow))}vh`, width: perRow > 1 ? `${(100 / (perRow)) - (10 / (perRow))}vw` : 'min(500px, 90vw)'}}></canvas>
    )
}

