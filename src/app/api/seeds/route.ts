

import { getSeeds } from '@/util/db'

export async function GET(request: Request) {
    const url = new URL(request.url);
    const params = url.searchParams;

    try {
        const wallet = params.get("wallet");
        if (wallet){
            const seeds = await getSeeds(wallet?.toLowerCase())
            // console.log(seeds)
            return new Response(JSON.stringify({seeds}));
      
        } else {
            return new Response(JSON.stringify({error: 'Missing wallet parameter'}));
        }

      } catch (e) {
        console.log('ERROR debug : ', e);
        return new Response(JSON.stringify(e));
      }

}