import SeedPurse from '@/components/SeedPurse'

export default function Home({ params }: { params: { id: string } }) {
  console.log("PARAMS", params)
  let tmpAddress = ""

  // id could be an integer or a hex string (with or without 0x prefix) needs to be converted to a 0x prefixed hex string
  // if its an integer, convert to hex string, if its a hex string, check if its 0x prefixed, if not, add 0x prefix
  // in all cases, make sure we end up with a 0x prefixed 40-character hex string
  if (params.id.length == 64) {
    tmpAddress = "0x" + params.id
  }
  else if (!isNaN(Number(params.id))) {
    tmpAddress = "0x" + BigInt(params.id).toString(16).padStart(40, "0")
  } else if (params.id.startsWith("0x")) {
    // check if its 40 characters
    if (params.id.length == 42) {
      tmpAddress = params.id
    } else {
      tmpAddress = "0x" + params.id.slice(2).padStart(40, "0")
    }
  } else {
    tmpAddress = "0x" + params.id.padStart(40, "0")
  }

  // if it's for the zero address, return an empty main
  if (tmpAddress == "0x0000000000000000000000000000000000000000") {
    return <main>No seed purse for the zero address</main>
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <SeedPurse id={tmpAddress} />
    </main>
  )
}