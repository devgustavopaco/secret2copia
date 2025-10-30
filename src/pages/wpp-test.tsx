import { useEffect } from "react";

export default function WppTest() {
  const url =
    "https://api.whatsapp.com/send/?phone=5511969972329&text=Fala+Gu%21+Quero+saber+mais+sobre+Arbitragem+Manual%21&type=phone_number&app_absent=0";

  //   useEffect(() => {
  //     window.open(url, "_blank");
  //   }, []);

  return (
    <div>
      <h1>WppTest</h1>
      <a href={url} target="_blank">
        Open WhatsApp
      </a>
    </div>
  );
}
