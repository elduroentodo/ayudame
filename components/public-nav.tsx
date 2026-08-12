"use client";
import Link from "next/link";
import { useState } from "react";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <nav className="nav shell" aria-label="Navegación principal">
    <Link className="brand" href="/" onClick={close}><span className="brand-mark">a</span><span>ayúdame</span></Link>
    <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen((value) => !value)}>{open ? "Cerrar" : "Menú"}</button>
    <div className={open ? "nav-links open" : "nav-links"} id="public-menu">
      <Link href="/#como-funciona" onClick={close}>Cómo funciona</Link>
      <Link href="/precios" onClick={close}>Planes</Link>
      <Link href="/#contacto" onClick={close}>Contacto</Link>
    </div>
    <Link className="button button-small button-dark nav-login" href="/login" onClick={close}>Ingresar</Link>
  </nav>;
}