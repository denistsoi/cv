import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>dtsoi</title>
        <meta name="description" content="dtsoi" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Hi there 👋🏻 I&apos;m <span className={styles.name}>Denis.</span>
        </h1>

        <p className={styles.description}>
          Engineer with 10+ years experience.<br />
          Currently Building. In this world; we need builders.
        </p>

      </main>
    </div>
  )
}

export default Home
