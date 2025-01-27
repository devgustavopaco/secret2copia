import React, { useState, useEffect } from "react";

const PriceDisplay: React.FC = () => {
  const [flash, setFlash] = useState(false);
  const [price, setPrice] = useState("");

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <div className={`${flash ? "bg-green-100" : ""} transition-colors`}>
      {price}
    </div>
  );
};

export default PriceDisplay;
