import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faFacebookF, faInstagram } from '@fortawesome/free-brands-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { NextPage } from 'next'

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
              <span>Username</span>
              <input type="text" name="" />
            </div>
            <div className={styles.inputBox}>
              <span>Password</span>
              <input type="password" name="" />
            </div>

            <div className={styles.remember}>
              <label>
                <input type="checkbox" name="" />
                Remember me
              </label>
            </div>

            <div className={styles.inputBox}>
              <input type="submit" value="Sign In" name="" />
            </div>

            <div className={styles.inputBox}>
              <p>
                Don&apos;t have an account? <a href="#">Sign up</a>
              </p>
            </div>
          </form>
          <h3>Follow us on social medias</h3>

          <div className={styles.socialMedia}>
            <FontAwesomeIcon icon={faPropFacebook} className={styles.icon} />

            <FontAwesomeIcon icon={faPropGoogle} className={styles.icon} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
