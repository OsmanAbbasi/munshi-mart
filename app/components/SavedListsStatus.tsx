"use client";
import { useCart } from "../context/CartContext";
export default function SavedListsStatus() {
  const {
    hydrated,
    catalogStatus,
    catalogError,
    storageError,
    quantityNote,
    retryCatalog,
  } = useCart();
  return (
    <>
      {(!hydrated || catalogStatus === "loading") && (
        <p className="shopping-notice" role="status">
          Checking saved products against the current catalog…
        </p>
      )}
      {storageError && (
        <p className="shopping-notice shopping-error" role="alert">
          {storageError}
        </p>
      )}
      {catalogError && (
        <div className="shopping-notice shopping-error" role="alert">
          <p>{catalogError}</p>
          <button className="btn btn-outline" onClick={retryCatalog}>
            Retry catalog
          </button>
        </div>
      )}
      {quantityNote && (
        <p className="shopping-notice" role="status">
          {quantityNote}
        </p>
      )}
    </>
  );
}
