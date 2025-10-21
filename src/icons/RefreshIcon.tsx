import { IconProps } from "phosphor-react";

function RefreshIcon({ ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M4 12C4 7.58172 7.58172 4 12 4C14.1217 4 16.0425 4.84285 17.4142 6.21447L15 8.62868V4H19L16.5858 6.41421C14.8284 4.65685 12.4142 3.5 10 3.5C5.85786 3.5 2.5 6.85786 2.5 11C2.5 15.1421 5.85786 18.5 10 18.5C12.5 18.5 14.5 17.5 16 15.5H18C16.5 18.5 13.5 20.5 10 20.5C5.58172 20.5 2 16.9183 2 12H4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default RefreshIcon;
