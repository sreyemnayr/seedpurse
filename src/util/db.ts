import { cache } from 'react'
import clientPromise from '@/lib/mongodb'
import { Document, ObjectId } from 'mongodb'

export const getSeeds = cache(async (wallet: string) => {
    const client = await clientPromise
    const db = client.db('seeds')
    const collection = db.collection('SeedPurses')

    const items = await collection.find({ owner: wallet.toLowerCase(), progress: {$gte: 100} }).project({ tokenId: 1, minted: 1, protected: 1 }).toArray()
    return items.map((item: Document) => {
        return {
            _id: item._id,
            i: item.tokenId,
            m: item.minted,
            p: item.protected
        }
    })
})

export const getSeed = cache(async (id: string) => {
    console.log(id)
    const client = await clientPromise
    const db = client.db('seeds')
    const collection = db.collection('SeedPurses')

    const item = await collection.findOne({ _id: new ObjectId(id) })
    return item
})

