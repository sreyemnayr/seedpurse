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

  let size = 500;
  if (params.slug.length === 2) {
    size = parseInt(params.slug[0]);
    // if size > 2000 then return error
    if (size > 2000 || size < 1) {
      return NextResponse.json({ error: 'Invalid size. Use a size less than 2000 and greater than 0.' }, { status: 400 });
    }
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
    const imageBuffer = await generateSeedImage(Number(id), size);
    console.log('Image buffer received, size:', imageBuffer.length);
    
    let outputBuffer: Buffer;
    if (format === 'jpeg') {
      outputBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
    } else {
      outputBuffer = imageBuffer;
    }
    console.log('Output buffer prepared, size:', outputBuffer.length);

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating seed image:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Failed to generate seed image', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}