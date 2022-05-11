import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
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
          I&apos;m a developer with 8+ years experience, and currently a Team Lead at Mox.<br />
          If you&apos;d like to reach out to me, you can find my details below.
        </p>

        <ul>
          <li className={styles.listItem}><Link href="https://www.linkedin.com/in/denistsoi/">Linkedin</Link></li>
          <li className={styles.listItem}><Link href="https://www.github.com/denistsoi/">Github</Link></li>
          <li className={styles.listItem}><Link href="https://stackoverflow.com/users/2312051/denis-tsoi">Stackoverflow</Link></li>
        </ul>
      </main>
    </div>
  )
}

export default Home
