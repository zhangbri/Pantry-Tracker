import Head from 'next/head'

export default function SEO({ title, description, canonicalUrl }) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  )
}