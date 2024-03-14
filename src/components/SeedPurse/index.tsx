"use client"
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import SeedCanvas from '@/components/SeedCanvas'
import { useSearchParams } from 'next/navigation'

const tailwind_grid_rows = [
    "grid-rows-1 grid-cols-1",
    "grid-rows-1 grid-cols-1",
    "grid-rows-2 grid-cols-2",
    "grid-rows-3 grid-cols-3",
    "grid-rows-4 grid-cols-4",
    "grid-rows-5 grid-cols-5",
    "grid-rows-6 grid-cols-6",
    "grid-rows-7 grid-cols-7",
    "grid-rows-8 grid-cols-8",
    "grid-rows-9 grid-cols-9",
    "grid-rows-10 grid-cols-10",
    "grid-rows-11 grid-cols-11",
    "grid-rows-12 grid-cols-12",
]
 
export default function SeedPurse({id}: {id?: string}) {
    const searchParams = useSearchParams()
    const { address } = useAccount() 
    
    console.log(address)
    // const address = '0x'
    // todo: type/schema for seed db return
    const [seeds, setSeeds] = useState<any[]>([])
    const [currentSeed, setCurrentSeed] = useState<number>(-1)
    const [seedData, setSeedData] = useState<any>({})
    const [useAddress, setUseAddress] = useState<string>(id || "")
    const [perRow, setPerRow] = useState<number>(1)
    const [prevPerRow, setPrevPerRow] = useState<number>(5)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if(id && id !== ""){
            setUseAddress(id)
            console.log(id)
        } else {
            console.log(address)
            let tmpAddress = address || ""
            if (searchParams.has('wallet')) {
                tmpAddress = searchParams.get('wallet') || ""
            }
            if (searchParams.has('id')) {
                tmpAddress = searchParams.get('id') || ""
                if (tmpAddress.length == 64) {
                    tmpAddress = "0x" + tmpAddress
                }
                tmpAddress = "0x" + BigInt(tmpAddress).toString(16).padStart(40, "0")
            }
            setUseAddress(tmpAddress)
        }
    }, [address])

    useEffect(()=> {
        setLoading(true)
        if(useAddress){
            fetch(`/api/seeds?wallet=${useAddress}`).then((res) => res.json()).then((data) => {setSeeds(data?.seeds || []); setLoading(false)})
        }
    }, [useAddress])

    useEffect(()=>{
        if(seeds && seeds.length>0){
            setCurrentSeed(0)
            setPerRow(Math.min(Math.floor(Math.sqrt(seeds.length)), 12))
        }
    }, [JSON.stringify(seeds)])

    useEffect(() => {
        if(currentSeed>=0){
            fetch(`/api/seed?id=${seeds[currentSeed]._id}`).then((res) => res.json()).then((data) => {console.log(data.seed); setSeedData(data.seed)})
        }
        console.log(seedData)
        
    }, [currentSeed])

  return (
  <div className="w-[90vh] h-[90vw] items-center align-center flex flex-col">
    <div className={`grid ${tailwind_grid_rows[perRow]} gap-0`}>
        {loading && <div>Loading...</div>}
    {currentSeed >= 0 && useAddress != "" && 
        seeds?.slice(currentSeed).concat(seeds?.slice(0, currentSeed)).slice(0, perRow*perRow).map((seed, idx) => (
            <div key={`SEED_${seed.i}_${currentSeed + idx < seeds.length ? currentSeed + idx : currentSeed + idx - seeds.length}`} className="items-center align-center flex flex-col" onClick={()=>{
            //     if(currentSeed == currentSeed + idx){
            //         setCurrentSeed((cur)=>{
            //             if (cur+(perRow*perRow)<seeds.length){
            //             return cur+(perRow*perRow)
            //         } else {
            //             return 0
            //         }

            //     })
            // } else {
                
                
            // }
            const this_seed_idx = currentSeed + idx < seeds.length ? currentSeed + idx : currentSeed + idx - seeds.length;
            setPerRow((p) => { if(p==1) { return prevPerRow } else { setCurrentSeed(this_seed_idx); console.log(idx); setPrevPerRow(p); return 1}})
        }}>
            <SeedCanvas seedId={seed.i} perRow={perRow} />
            {seedData && perRow == 1 && (
                <div className="w-full items-center align-center flex flex-col">
                    <div>Id: {seedData.tokenId}</div>
                    <div>Harvested by #{seedData.location}</div>
                    <div>{seedData.protected ? "PROTECTED" : "UNPROTECTED"}</div>
                    <div>{seedData.minted ? "MINTED" : "UNMINTED"}</div>
                    <div>DNA: {seedData.dna}</div>
                </div>
            )}
            
        </div>
  ))
  
    }
    </div>
    <select className="bg-transparent" value={currentSeed} onChange={(e) => {
        console.log(e.target.value)
        setCurrentSeed(parseInt(e.target.value))
        }}>
    {seeds?.map((seed, idx) => (
      <option className="bg-transparent" value={idx} key={`seed_option_${idx}_${seed.i}`}>{seed.i}</option>
    ))}
    </select>
    <input className="bg-transparent" type="number" value={perRow} onChange={(e) => setPerRow(parseInt(e.target.value)%12)} />
  </div>
    )
}

