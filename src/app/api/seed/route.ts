

import { getSeed } from '@/util/db'

export async function GET(request: Request) {
    const url = new URL(request.url);
    const params = url.searchParams;

    try {
        const id = params.get("id");
        if (id){
            const seed = await getSeed(id)
            // console.log(seed)
            return new Response(JSON.stringify({seed}));
      
        } else {
            return new Response(JSON.stringify({error: 'Missing id parameter'}));
        }

      } catch (e) {
        console.log('ERROR debug : ', e);
        return new Response(JSON.stringify(e));
      }

}