import styles from './styles.module.scss'
import { Visibility } from '@material-ui/icons'

export function WidgetSm() {
  return (
    <div className={styles.widgetSm}>
      <span className={styles.widgetSmTitle}>Novos Membros</span>
      <ul className={styles.widgetSmList}>
        <li className={styles.widgetSmListItem}>
          <img
            src="/images/Users/Herbert.png"
            alt=""
            className={styles.widgetSmImg}
          />
          <div className={styles.widgetSmUser}>
            <span className={styles.widgetSmUsername}>Herbert Souza</span>
            <span className={styles.widgetSmUserTitle}>Engenheiro</span>
          </div>
          <button className={styles.widgetSmButton}>
            <Visibility className={styles.widgetSmIcon} />
            Visualizar
          </button>
        </li>
        <li className={styles.widgetSmListItem}>
          <img
            src="/images/Users/Thiago.jpg"
            alt=""
            className={styles.widgetSmImg}
          />
          <div className={styles.widgetSmUser}>
            <span className={styles.widgetSmUsername}>Thiago Medeiros</span>
            <span className={styles.widgetSmUserTitle}>Engenheiro</span>
          </div>
          <button className={styles.widgetSmButton}>
            <Visibility className={styles.widgetSmIcon} />
            Visualizar
          </button>
        </li>
        <li className={styles.widgetSmListItem}>
          <img
            src="/images/Users/Barbara.jpg"
            alt=""
            className={styles.widgetSmImg}
          />
          <div className={styles.widgetSmUser}>
            <span className={styles.widgetSmUsername}>Barbara Novaes</span>
            <span className={styles.widgetSmUserTitle}>
              Analista de Sistema
            </span>
          </div>
          <button className={styles.widgetSmButton}>
            <Visibility className={styles.widgetSmIcon} />
            Visualizar
          </button>
        </li>
        <li className={styles.widgetSmListItem}>
          <img
            src="/images/Users/NigreCliente.jpg"
            alt=""
            className={styles.widgetSmImg}
          />
          <div className={styles.widgetSmUser}>
            <span className={styles.widgetSmUsername}>José Nigre</span>
            <span className={styles.widgetSmUserTitle}>Fundador</span>
          </div>
          <button className={styles.widgetSmButton}>
            <Visibility className={styles.widgetSmIcon} />
            Visualizar
          </button>
        </li>
      </ul>
    </div>
  )
}
