import { IconProps } from "phosphor-react";

function CalculatorIcon({ ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <rect
        x="4"
        y="2"
        width="16"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect x="6" y="4" width="12" height="4" rx="1" fill="currentColor" />
      <circle cx="7" cy="10" r="1" fill="currentColor" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="13" cy="10" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <circle cx="7" cy="13" r="1" fill="currentColor" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="13" cy="13" r="1" fill="currentColor" />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
      <circle cx="7" cy="16" r="1" fill="currentColor" />
      <circle cx="10" cy="16" r="1" fill="currentColor" />
      <circle cx="13" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <circle cx="7" cy="19" r="1" fill="currentColor" />
      <circle cx="10" cy="19" r="1" fill="currentColor" />
      <circle cx="13" cy="19" r="1" fill="currentColor" />
      <circle cx="16" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export default CalculatorIcon;
