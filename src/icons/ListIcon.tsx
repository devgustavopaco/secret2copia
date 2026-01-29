import { IconProps } from "phosphor-react";

function ListIcon({ ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <rect x="3" y="4" width="18" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="8" width="18" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="12" width="18" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="20" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default ListIcon;
