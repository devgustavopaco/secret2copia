import styles from './styles.module.scss'

import { NotificationsNone, Language, Settings } from '@material-ui/icons'

export function HeaderAdmin() {
  return (
    <div className={`${styles.topbar} container`}>
      <div className={styles.topBarWrapper}>
        <div className="topLeft">
          <span className={styles.logo}>Nigre Admin</span>
        </div>
        <div className={styles.topRight}>
          <div className={styles.topbarIconContainer}>
            <NotificationsNone />
            <span className={styles.topIconBadge}>2</span>
          </div>
          <div className={styles.topbarIconContainer}>
            <Language />
            <span className={styles.topIconBadge}>2</span>
          </div>
          <div className={styles.topbarIconContainer}>
            <Settings />
          </div>
          <img
            src="/images/Users/NigreCliente.jpg"
            alt=""
            className={styles.topAvatar}
          />
        </div>
      </div>
    </div>
  )
}
