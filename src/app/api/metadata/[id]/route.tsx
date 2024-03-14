export async function GET(request: Request, {params}: {params: {id: string}}) {
    // const url = new URL(request.url);
    // const params = url.searchParams;
    const id = params.id

    try {
        // const id = params.get("id");
        if (id){
            let tmpAddress = ""
            if (id.length == 64) {
                tmpAddress = "0x" + id
            } else {
                tmpAddress = id
            }
            tmpAddress = "0x" + BigInt(tmpAddress).toString(16).padStart(40, "0")

            const info = {
                "description": "Authentic seeds grown by Flower Girls. A tax (see collection description) will be assessed on each transfer.",
                "external_url": "https:/seeds.flowergirlsnft.com",
                "image": "ipfs://QmSTZXx6231kjqhePmbKLWFTbgyept4FDqU2n353ci3VGy",
                "animation_url": `https://seeds.flowergirlsnft.com/embed/${id}`,
                "name": "Seed Purse",
                "attributes": [{
                    "trait_type": "Seed Purse",
                    "value": `${tmpAddress}`
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