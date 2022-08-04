import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faFacebookF, faInstagram } from '@fortawesome/free-brands-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { NextPage } from 'next'
import Link from 'next/link'

import styles from '../styles/Login.module.scss'

const Login: NextPage = () => {
  const faPropFacebook = faInstagram as IconProp

  const faPropGoogle = faFacebookF as IconProp

  return (
    <section className={styles.body}>
      <div className={styles.contentBox}>
        <div className={styles.formBox}>
          <h2>Login</h2>
          <form>
            <div className={styles.inputBox}>
              <span>Email</span>
              <input type="text" name="" />
            </div>
            <div className={styles.inputBox}>
              <span>Senha</span>
              <input type="password" name="" />
            </div>

            <div className={styles.remember}>
              <input type="checkbox" name="" className={styles.check} />
              <span>Lembrar dados</span>
            </div>

            <div className={styles.inputBox}>
              <input type="submit" value="Sign In" name="" />
            </div>
          </form>
          <h3>Nos acompanhe nas redes sociais!</h3>

          <div className={styles.socialMedia}>
            <Link href="https://www.instagram.com/gustavonigre/">
              <FontAwesomeIcon icon={faPropFacebook} className={styles.icon} />
            </Link>
            <Link href="https://www.facebook.com/Guh.Nigre">
              <FontAwesomeIcon icon={faPropGoogle} className={styles.icon} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
