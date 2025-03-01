import React from 'react'
import Card from '../components/Card.js'
import { createClient } from 'urql'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const client = createClient({
  url: 'https://api.thegraph.com/subgraphs/name/dabit3/zoranftsubgraph'
})

const query = `
  query {
    tokens(
      orderBy: createdAtTimestamp
      orderDirection: desc
      first: 10
    ) {
      id
      tokenID
      contentURI
      metadataURI
    }
  }
`

// replace IPFS URL with cloudinary link
async function replaceWithCloudflareCDN(ipfsURL) {
  return ipfsURL.replace(/ipfs.fleek.co/, 'cloudflare-ipfs.com')
}

async function fetchData() {
  const data = await client
    .query(query)
    .toPromise()
    .then(async result => {
      const tokenData = await Promise.all(result.data.tokens.map(async token => {
        const meta = await (await fetch(token.metadataURI)).json().catch(err => {
          console.log(err)
          return {}
        })
        console.log(" meta: ", meta)
        if (meta && meta.mimeType === 'video/mp4') {
          token.type = 'video'
          token.meta = meta
        }
        else if (meta && meta.body && meta.body.mimeType === 'audio/wav') {
          token.type = 'audio'
          token.meta = meta.body
        }
        else {
          token.type = 'image'
          token.meta = meta
        }
        return token
      }))
      return tokenData
    })
  return data
}


export default function Home(props) {
  if (props.tokens && props.tokens.length) return (
    <div className=" px-6 sm:px-4 mx-auto max-w-lg sm:max-w-2xl md:max-w-full lg:max-w-screen-2xl md:px-8 lg:px-6 lg:py-16">
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  ">
      {
        props.tokens.map(token => {
          console.log(token.type)
          return token.type !== 'image' ? null :
            <div key={replaceWithCloudflareCDN(token.contentURI)} style={{
              padding: '20px 0px'
            }}>
              <Card
                key={token.contentURI}
                title={token.meta.name}
                description={token.meta.description}>
                <Image
                  className="rounded-t-xl h-96"
                  src={token.meta.url || token.contentURI}
                  alt={`nft-${token.meta.name}`}
                  width={500}
                  height={500}
                  quality={75}
                />
              </Card>
          </div>
        })
      }
    </div>
    </div>
  )
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      ...Loading
    </div>
  )

}

export async function getServerSideProps() {
  const data = await fetchData()
  return {
    props: {
      tokens: data
    }
  }
}
