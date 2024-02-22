"use client"
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import SeedCanvas from '@/components/SeedCanvas'
import { useSearchParams } from 'next/navigation'
 
export default function SeedPurse() {
    const searchParams = useSearchParams()
    const { address } = useAccount() 
    
    console.log(address)
    // const address = '0x'
    // todo: type/schema for seed db return
    const [seeds, setSeeds] = useState<any[]>([])
    const [currentSeed, setCurrentSeed] = useState<number>(-1)
    const [seedData, setSeedData] = useState<any>({})
    const [useAddress, setUseAddress] = useState<string>("")
    useEffect(() => {
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
        
    }, [address])

    useEffect(()=> {
        if(useAddress){
            fetch(`/api/seeds?wallet=${useAddress}`).then((res) => res.json()).then((data) => setSeeds(data?.seeds || []))
        }
    }, [useAddress])

    useEffect(()=>{
        if(seeds && seeds.length>0){
            setCurrentSeed(0)
        }
    }, [JSON.stringify(seeds)])

    useEffect(() => {
        if(currentSeed>=0){
            fetch(`/api/seed?id=${seeds[currentSeed]._id}`).then((res) => res.json()).then((data) => {console.log(data.seed); setSeedData(data.seed)})
        }
        console.log(seedData)
        
    }, [currentSeed])

  return (
  <div className="w-full items-center align-center flex flex-col">
    {currentSeed >= 0 && 
        <div className="w-full items-center align-center flex flex-col" onClick={()=>{
            setCurrentSeed((cur)=>{
                if (cur+1<seeds.length){
                    return cur+1
                } else {
                    return 0
                }
            })
        }}>
            <SeedCanvas seedId={seeds[currentSeed].i} />
            {seedData && (
                <div className="w-full items-center align-center flex flex-col">
                    <div>Id: {seedData.tokenId}</div>
                    <div>Harvested by #{seedData.location}</div>
                    <div>{seedData.protected ? "PROTECTED" : "UNPROTECTED"}</div>
                    <div>{seedData.minted ? "MINTED" : "UNMINTED"}</div>
                    <div>DNA: {seedData.dna}</div>
                </div>
            )}
            
        </div>
    }
    <select value={currentSeed} onChange={(e) => {
        console.log(e.target.value)
        setCurrentSeed(parseInt(e.target.value))
        }}>
    {seeds?.map((seed, idx) => (
      <option value={idx} key={`seed_option_${idx}_${seed.i}`}>{seed.i}</option>
    ))}
    </select>
  </div>
    )
}

