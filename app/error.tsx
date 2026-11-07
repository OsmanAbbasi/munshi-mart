"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container empty-state" role="alert">
      <h1>Something interrupted your visit.</h1>
      <p>Please try loading the page again.</p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
