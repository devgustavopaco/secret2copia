// components/Icons/ArrowIcon.tsx
type Props = { className?: string };

export default function CalculatorIcon({ className }: Props) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M21.0001 2.33333H7.00008C5.71142 2.33333 4.66675 3.378 4.66675 4.66666V23.3333C4.66675 24.622 5.71142 25.6667 7.00008 25.6667H21.0001C22.2887 25.6667 23.3334 24.622 23.3334 23.3333V4.66666C23.3334 3.378 22.2887 2.33333 21.0001 2.33333Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3335 7H18.6668M18.6668 16.3333V21M18.6668 11.6667H18.6785M14.0002 11.6667H14.0118M9.3335 11.6667H9.34516M14.0002 16.3333H14.0118M9.3335 16.3333H9.34516M14.0002 21H14.0118M9.3335 21H9.34516"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
