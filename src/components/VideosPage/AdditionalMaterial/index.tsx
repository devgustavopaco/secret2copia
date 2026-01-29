import { CaretRight, FileArrowDown, Image } from "phosphor-react";
import styles from "./styles.module.scss";

export function AdditionalMaterial() {
  return (
    <div className={styles.additionalMaterial}>
      <div className={styles.material}>
        <div className={styles.iconBackground}>
          <FileArrowDown size={32} />
        </div>
        <div className={styles.materialText}>
          <div className={styles.text}>
            <h2>Material complementar</h2>
            <span>
              Acesse o material complementar para acelerar o seu desenvolvimento
            </span>
          </div>
          <CaretRight size={32} />
        </div>
      </div>
      <div className={styles.material}>
        <div className={styles.iconBackground}>
          <Image size={32} />
        </div>
        <div className={styles.materialText}>
          <div className={styles.text}>
            <h2>Wallpapers exclusivos</h2>
            <span>
              Baixe wallpapers exclusivos do Ignite Lab e personalize a sua
              máquina
            </span>
          </div>
          <CaretRight size={32} />
        </div>
      </div>
    </div>
  );
}
