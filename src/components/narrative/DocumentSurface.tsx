"use client";
import type { ReactNode } from "react";
/** One stable semantic form; child editors keep their existing explicit commands.
 * Native text selection and keyboard survive scene and viewport changes. */
export function DocumentSurface({
  children,
  inactive,
}: {
  children: ReactNode;
  inactive: boolean;
}) {
  return (
    <form
      aria-label="Documento de criação do personagem"
      className="cinema-document-layout"
      inert={inactive}
      onSubmit={(event) => event.preventDefault()}
    >
      {children}
    </form>
  );
}
