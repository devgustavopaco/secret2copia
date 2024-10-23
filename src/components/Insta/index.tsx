import router from "next/router";
import { useState } from "react";
import styles from "./styles.module.scss";

const TikTok = () => {
  const [lightPosition, setLightPosition] = useState({
    x: 0,
    y: 0,
    visible: false,
  });
  const scaleFactor = 1.05;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const overlaySize = 100; // Half the overlay size for centering
    const { left, top } = event.currentTarget.getBoundingClientRect();
    const adjustedX = (event.clientX - left) / scaleFactor;
    const adjustedY = (event.clientY - top) / scaleFactor;

    setLightPosition({
      x: adjustedX - overlaySize,
      y: adjustedY - overlaySize,
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setLightPosition((prevPosition) => ({ ...prevPosition, visible: false }));
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push(
      "https://api.whatsapp.com/send/?phone=5511932762732&text=Fala+Gu%21+Quero+saber+mais+sobre+Arbitragem+Manual%21&type=phone_number&app_absent=0"
    );
  };

  return (
    <>
      <section
        className={styles.container}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div
          className={styles.lightEffect}
          style={{
            background: `radial-gradient(circle closest-side, rgba(255, 255, 255, 0.3), transparent)`,
            transform: `translate(${lightPosition.x}px, ${lightPosition.y}px)`,
            opacity: lightPosition.visible ? 1 : 0,
          }}
        />
        <div className={styles.content}>
          <div className={styles.icon}>
            <img src="/whats.png" />
          </div>
          <div className={styles.text}>
            <h2>Quero saber mais!</h2>
            <h5>Quer entender mais sobre?</h5>
            <h5>Clique aqui para falar diretamente comigo!</h5>
          </div>
        </div>
      </section>
    </>
  );
};
export default TikTok;
