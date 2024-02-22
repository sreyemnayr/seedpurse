export async function GET(request: Request) {
    const url = new URL(request.url);
    const params = url.searchParams;

    try {
        const id = params.get("id");
        if (id){
            const info = {
                "description": "Authentic seeds grown by Flower Girls. A tax (see collection description) will be assessed on each transfer.",
                "external_url": "https://flowergirlsnft.com",
                "image": "ipfs://QmSTZXx6231kjqhePmbKLWFTbgyept4FDqU2n353ci3VGy",
                "animation_url": `https://seedpurse.vercel.app/embed/?id=${id}`,
                "name": "Seed Purse",
                "attributes": [{
                    "trait_type": "Seed Purse",
                    "value": `${id}`
                }]
            }
            console.log(info)
            return new Response(JSON.stringify(info));
      
        } else {
            return new Response(JSON.stringify({error: 'Missing id parameter'}));
        }

      } catch (e) {
        console.log('ERROR debug : ', e);
        return new Response(JSON.stringify(e));
      }

}