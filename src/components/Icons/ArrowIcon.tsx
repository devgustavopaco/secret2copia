// components/Icons/ArrowIcon.tsx
type Props = { className?: string };

export default function ArrowIcon({ className }: Props) {
  return (
    <svg
      className={className}
      width="16"
      height="10"
      viewBox="0 0 16 10"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0 2L2 0L8 6L14 0L16 2L8 10L0 2Z" />
    </svg>
  );
}
