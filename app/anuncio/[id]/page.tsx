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

export default function Page(){

  const [anuncios,setAnuncios] = useState<Anuncio[]>([])
  const [busqueda,setBusqueda] = useState("")
  const [provincia,setProvincia] = useState("")

  useEffect(()=>{
    cargar()
  },[])

  async function cargar(){

    const res = await fetch("/api/anuncios")
    const data = await res.json()

    if(data.ok){
      setAnuncios(data.anuncios)
    }

  }

  const filtrados = anuncios.filter((a)=>{

    const coincideBusqueda =
      a.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(busqueda.toLowerCase())

    const coincideProvincia =
      provincia === "" || a.provincia === provincia

    return coincideBusqueda && coincideProvincia
  })

  return(

    <main style={{padding:40,maxWidth:1100,margin:"auto"}}>

      <h1>PuraVenta</h1>

      <div
        style={{
          display:"flex",
          gap:10,
          marginTop:20,
          marginBottom:20
        }}
      >

        <input
          placeholder="Buscar..."
          value={busqueda}
          onChange={e=>setBusqueda(e.target.value)}
          style={{
            padding:10,
            flex:1
          }}
        />

        <select
          value={provincia}
          onChange={e=>setProvincia(e.target.value)}
        >
          <option value="">Todas</option>
          <option>San José</option>
          <option>Alajuela</option>
          <option>Cartago</option>
          <option>Heredia</option>
          <option>Guanacaste</option>
          <option>Puntarenas</option>
          <option>Limón</option>
        </select>

      </div>

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",
          gap:20
        }}
      >

        {filtrados.map((anuncio)=>(

          <Link
            key={anuncio.id}
            href={`/anuncio/${anuncio.id}`}
            style={{
              border:"1px solid #ddd",
              borderRadius:12,
              padding:12,
              textDecoration:"none",
              color:"black"
            }}
          >

            {anuncio.fotos?.length ? (
              <img
                src={anuncio.fotos[0]}
                style={{
                  width:"100%",
                  height:180,
                  objectFit:"cover",
                  borderRadius:8
                }}
              />
            ) : null}

            <h3 style={{marginTop:10}}>
              {anuncio.titulo}
            </h3>

            <p>
              ₡{anuncio.precio}
            </p>

            <p style={{fontSize:12}}>
              {anuncio.provincia}
            </p>

          </Link>

        ))}

      </div>

    </main>
  )
}