import { NextRequest, NextResponse } from 'next/server';
import { generateSeedImage } from '@/components/ServerSeedCanvas';
import sharp from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  if (params.slug.length < 1) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  const idParts = params.slug.slice(0, -1);
  const [fileNamePart, ext] = params.slug[params.slug.length - 1].split('.');
  // const id = [...idParts, fileNamePart].join('.');
  const id = fileNamePart;
  const format = ext === 'jpg' ? 'jpeg' : ext;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid or missing ID' }, { status: 400 });
  }

  if (format !== 'png' && format !== 'jpeg') {
    return NextResponse.json({ error: 'Invalid format. Use .png or .jpg' }, { status: 400 });
  }

  try {
    const imageBuffer = await generateSeedImage(Number(id));
    
    let outputBuffer: Buffer;
    if (format === 'jpeg') {
      outputBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
    } else {
      outputBuffer = imageBuffer;
    }

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating seed image:', error);
    return NextResponse.json({ error: 'Failed to generate seed image' }, { status: 500 });
  }
}