import { HTMLAttributes } from "react";

export interface IconProps extends HTMLAttributes<SVGSVGElement> {
  className?: string;
}

// Export new calculator icons
export { default as ChartIcon } from "./ChartIcon";
export { default as CalculatorIcon } from "./CalculatorIcon";
export { default as RefreshIcon } from "./RefreshIcon";
export { default as PhoneIcon } from "./PhoneIcon";
export { default as ListIcon } from "./ListIcon";
