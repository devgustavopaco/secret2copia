import styles from "./styles.module.scss";

const Header = () => {
  return (
    <header className={styles.header}>
      <p>
        Olá, bem-vindo de volta <strong>Gustavo Nigre</strong>
      </p>
      <div className={styles.loginBlock}>
        <div className={styles.avatarWrapper}>
          <img src="/NIGRE.jpg" alt="" />
        </div>
        <div className={styles.rightSide}>
          <p>Gustavo Nigre</p>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
