type Props = { className?: string };

export default function ConfigIcon({ className }: Props) {
  return (
    <svg
      width="27"
      height="23"
      viewBox="0 0 27 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13.4939 14.9939C14.438 14.9939 15.3435 14.6256 16.0111 13.9699C16.6787 13.3143 17.0537 12.4251 17.0537 11.4979C17.0537 10.5708 16.6787 9.68156 16.0111 9.02594C15.3435 8.37033 14.438 8.00201 13.4939 8.00201C12.5497 8.00201 11.6442 8.37033 10.9766 9.02594C10.309 9.68156 9.93398 10.5708 9.93398 11.4979C9.93398 12.4251 10.309 13.3143 10.9766 13.9699C11.6442 14.6256 12.5497 14.9939 13.4939 14.9939ZM19.7247 1.01013L25.9555 11.4979L19.7247 21.9858H7.26304L1.03223 11.4979L7.26304 1.01013H19.7247Z"
        stroke="white"
        strokeWidth="1.711"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
