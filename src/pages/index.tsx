import type { GetServerSideProps, NextPage } from 'next'
import { unstable_getServerSession } from 'next-auth/next'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Router from 'next/router'
import { InstagramLogo } from 'phosphor-react'
import { useState } from 'react'

import styles from '../styles/Login.module.scss'
import { authOptions } from './api/auth/[...nextauth]'

const Login: NextPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const response = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (response?.error) {
      console.error(response.error)
      return Router.push('/')
    }
    return Router.push('/monitor')
  }

  return (
    <section className={styles.body}>
      <div className={styles.contentBox}>
        <div className={styles.formBox}>
          <h1>Login</h1>
          <form action="" onSubmit={handleSubmit}>
            <div className={styles.inputBox}>
              <span>Email</span>
              <input type="text" value={email} onChange={handleEmailChange} />
            </div>
            <div className={styles.inputBox}>
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>

            <div className={styles.inputBox}>
              <button type="submit">Entrar</button>
            </div>
          </form>

          <div className={styles.socialMedia}>
            <h3>Nos acompanhe nas redes sociais!</h3>

            <Link
              href="https://www.instagram.com/gustavonigre/"
              target="_blank"
            >
              <a target="_blank">
                <InstagramLogo className={styles.icon} />
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      props: {},
    }
  }

  return {
    redirect: {
      destination: '/monitor',
      permanent: true,
    },
  }
}
