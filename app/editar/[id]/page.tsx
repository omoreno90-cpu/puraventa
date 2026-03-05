"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

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

  const params = useParams()
  const router = useRouter()

  const [titulo,setTitulo] = useState("")
  const [descripcion,setDescripcion] = useState("")
  const [precio,setPrecio] = useState("")
  const [provincia,setProvincia] = useState("")
  const [ciudad,setCiudad] = useState("")
  const [whatsapp,setWhatsapp] = useState("")
  const [fotos,setFotos] = useState<string[]>([])

  useEffect(()=>{
    cargar()
  },[])

  async function cargar(){

    const res = await fetch("/api/anuncios")
    const data = await res.json()

    const anuncio = data.anuncios.find(
      (a:Anuncio)=>a.id === params.id
    )

    if(!anuncio) return

    setTitulo(anuncio.titulo)
    setDescripcion(anuncio.descripcion)
    setPrecio(String(anuncio.precio))
    setProvincia(anuncio.provincia)
    setCiudad(anuncio.ciudad)
    setWhatsapp(anuncio.whatsapp)
    setFotos(anuncio.fotos || [])
  }

  async function guardar(e:any){

    e.preventDefault()

    const res = await fetch(`/api/anuncios/${params.id}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        titulo,
        descripcion,
        precio:Number(precio),
        provincia,
        ciudad,
        whatsapp,
        fotos
      })
    })

    const data = await res.json()

    if(data.ok){
      router.push(`/anuncio/${params.id}`)
    }
  }

  return(

    <main style={{padding:40,maxWidth:700,margin:"auto"}}>

      <h1>Editar anuncio</h1>

      <form
        onSubmit={guardar}
        style={{display:"grid",gap:12}}
      >

        <input
          value={titulo}
          onChange={e=>setTitulo(e.target.value)}
          placeholder="Título"
        />

        <textarea
          value={descripcion}
          onChange={e=>setDescripcion(e.target.value)}
          placeholder="Descripción"
        />

        <input
          value={precio}
          onChange={e=>setPrecio(e.target.value)}
          placeholder="Precio"
        />

        <input
          value={provincia}
          onChange={e=>setProvincia(e.target.value)}
          placeholder="Provincia"
        />

        <input
          value={ciudad}
          onChange={e=>setCiudad(e.target.value)}
          placeholder="Ciudad"
        />

        <input
          value={whatsapp}
          onChange={e=>setWhatsapp(e.target.value)}
          placeholder="WhatsApp"
        />

        {fotos.length > 0 && (
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {fotos.map((f)=>(
              <img
                key={f}
                src={f}
                style={{
                  width:120,
                  borderRadius:8
                }}
              />
            ))}
          </div>
        )}

        <button
          style={{
            background:"#0A2540",
            color:"white",
            padding:"10px",
            borderRadius:6
          }}
        >
          Guardar cambios
        </button>

      </form>

    </main>
  )
}