import SeedPurse from '@/components/SeedPurse'

export default function Home({ params }: { params: { id: string } }) {
  console.log("PARAMS", params)
  let tmpAddress = ""
  if (params.id.length == 64) {
    tmpAddress = "0x" + params.id
  } else {
    tmpAddress = params.id
  }
  tmpAddress = "0x" + BigInt(tmpAddress).toString(16).padStart(40, "0")

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <SeedPurse id={tmpAddress} />
    </main>
  )
}