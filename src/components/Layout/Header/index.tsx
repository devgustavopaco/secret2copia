import styles from "./styles.module.scss";

const Header = () => {
  return (
    <header className={styles.header}>
      <p>
        Olá, bem-vindo de volta <strong>Gustavo Nigre</strong>
      </p>
      <div className={styles.loginBlock}>
        <div className={styles.avatarWrapper}>
          <img
            src="https://firebasestorage.googleapis.com/v0/b/unimed-crud.appspot.com/o/nigreTT.jpeg?alt=media&token=e676a87d-eddb-4c52-9c84-7addd4195896"
            alt=""
          />
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
