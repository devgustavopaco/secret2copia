type Props = { className?: string };

export default function MuteIcon({ className }: Props) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7 4.5L4.8 6.3H3C2.72 6.3 2.5 6.52 2.5 6.8V9.2C2.5 9.48 2.72 9.7 3 9.7H4.8L7 11.5C7.32 11.76 7.8 11.53 7.8 11.12V4.88C7.8 4.47 7.32 4.24 7 4.5Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.1 6.1L13.5 9.5" stroke="white" strokeLinecap="round" />
      <path d="M13.5 6.1L10.1 9.5" stroke="white" strokeLinecap="round" />
    </svg>
  );
}
