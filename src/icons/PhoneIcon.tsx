import { IconProps } from "phosphor-react";

function PhoneIcon({ ...props }: IconProps) {
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
        x="6"
        y="2"
        width="12"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect x="8" y="4" width="8" height="12" rx="1" fill="currentColor" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

export default PhoneIcon;
