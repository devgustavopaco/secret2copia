import { IconProps } from "phosphor-react";

function ChartIcon({ ...props }: IconProps) {
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
        d="M3 13H7V21H3V13ZM9 3H13V21H9V3ZM15 8H19V21H15V8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default ChartIcon;
