import { ImageResponse } from 'next/og';
import SeedCanvas from '@/components/SeedCanvas'

export async function GET(request: Request) {
    const url = new URL(request.url);
    const params = url.searchParams;

    try {
        const id = params.get("id");
        if (id){
            
            return new ImageResponse(
            <SeedCanvas seedId={Number(id)} />, {
                width: 500,
                height: 500,
                
            });
        } else {
            return new Response(JSON.stringify({error: 'Missing id parameter'}));
        }
    } catch (e) {
        console.log('ERROR debug : ', e);
        return new Response(JSON.stringify(e));
    }
}
