"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Anuncio = {
  id: string
  titulo: string
  descripcion: string
  precio: number
  provincia: string
  ciudad: string
  whatsapp: string
  fotos?: string[]
}

export default function Page() {

  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const res = await fetch("/api/anuncios")
    const data = await res.json()

    if (data.ok) {
      setAnuncios(data.anuncios)
    }

    setLoading(false)
  }

  async function borrar(id: string) {

    const ok = confirm("¿Borrar anuncio?")

    if (!ok) return

    await fetch(`/api/anuncios/${id}`, {
      method: "DELETE"
    })

    cargar()
  }

  if (loading) {
    return <main style={{padding:40}}>Cargando...</main>
  }

  return (
    <main style={{padding:40,maxWidth:900,margin:"auto"}}>

      <h1>Mis anuncios</h1>

      {anuncios.length === 0 && (
        <p>No hay anuncios.</p>
      )}

      <div style={{display:"grid",gap:20,marginTop:20}}>

        {anuncios.map((anuncio) => (

          <div
            key={anuncio.id}
            style={{
              border:"1px solid #ddd",
              borderRadius:12,
              padding:16
            }}
          >

            <h3>{anuncio.titulo}</h3>

            {anuncio.fotos?.length ? (
              <img
                src={anuncio.fotos[0]}
                style={{
                  width:"100%",
                  maxWidth:300,
                  borderRadius:8
                }}
              />
            ) : null}

            <p>
              <b>Precio:</b> ₡{anuncio.precio}
            </p>

            <p>
              {anuncio.provincia} / {anuncio.ciudad}
            </p>

            <div style={{display:"flex",gap:10,marginTop:10}}>

              <Link href={`/anuncio/${anuncio.id}`}>
                Ver anuncio
              </Link>

              <Link href={`/editar/${anuncio.id}`}>
                Editar
              </Link>

              <button
                onClick={() => borrar(anuncio.id)}
                style={{
                  background:"#dc2626",
                  color:"white",
                  border:"none",
                  padding:"8px 12px",
                  borderRadius:6,
                  cursor:"pointer"
                }}
              >
                Borrar
              </button>

            </div>

          </div>

        ))}

      </div>

    </main>
  )
}