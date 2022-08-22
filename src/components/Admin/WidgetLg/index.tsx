import styles from './styles.module.scss'

export function WidgetLg() {
  return (
    <div className={styles.widgetLg}>
      <h3 className={styles.widgetLgTile}>Últimas Transações</h3>
      <table className={styles.widgetLgTable}>
        <tr className={styles.widgetLgTr}>
          <th className={styles.widgetLgTh}>Cliente</th>
          <th className={styles.widgetLgTh}>Data</th>
          <th className={styles.widgetLgTh}>Valor</th>
        </tr>
        <tr className={styles.widgetLgTr}>
          <td className={styles.widgetLgUser}>
            <img
              src="/images/Users/Thiago.jpg"
              alt=""
              className={styles.widgetLgImg}
            />
            <span className={styles.widgetLgName}>Thiago Medeiros</span>
          </td>
          <td className={styles.widgetLgDate}>27 Julho 2022</td>
          <td className={styles.widgetLgAmount}>$0,00</td>
        </tr>
        <tr className={styles.widgetLgTr}>
          <td className={styles.widgetLgUser}>
            <img
              src="/images/Users/Herbert.png"
              alt=""
              className={styles.widgetLgImg}
            />
            <span className={styles.widgetLgName}>Herbert Souza</span>
          </td>
          <td className={styles.widgetLgDate}>27 Julho 2022</td>
          <td className={styles.widgetLgAmount}>$0,00</td>
        </tr>
        <tr className={styles.widgetLgTr}>
          <td className={styles.widgetLgUser}>
            <img
              src="/images/Users/NigreCliente.jpg"
              alt=""
              className={styles.widgetLgImg}
            />
            <span className={styles.widgetLgName}>José Nigre</span>
          </td>
          <td className={styles.widgetLgDate}>27 Julho 2022</td>
          <td className={styles.widgetLgAmount}>$0,00</td>
        </tr>
      </table>
    </div>
  )
}
