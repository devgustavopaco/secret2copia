import { IconProps } from "phosphor-react";

function MonitorIcon({ ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="18"
      viewBox="0 0 20 18"
      fill="none"
      {...props}
    >
      <path
        d="M18 0H2C0.9 0 0 0.9 0 2V13C0 14.1 0.9 15 2 15H5C4.45 15.55 4 15.87 4 16.59C4 17.37 4.63 18 5.41 18H14.58C15.36 18 15.99 17.37 15.99 16.59C15.99 15.87 15.55 15.56 14.99 15H17.99C19.09 15 19.99 14.1 19.99 13V2C20 0.9 19.1 0 18 0ZM18 13H2V2H18V13Z"
        fill="white"
      />
    </svg>
  );
}

export default MonitorIcon;
