import LoadingSkeleton from "./components/LoadingSkeleton";
export default function Loading() {
  return (
    <div
      className="container section"
      role="status"
      aria-label="Loading catalog"
    >
      <p className="eyebrow">A GOOD FIND IS ON ITS WAY…</p>
      <LoadingSkeleton count={8} />
    </div>
  );
}
