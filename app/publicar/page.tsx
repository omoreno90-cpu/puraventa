"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { PROVINCIAS, CANTONES } from "@/lib/ubicaciones";
import { moderarTexto } from "@/lib/moderacion";

const inter = Inter({ subsets: ["latin"], display: "swap" });

type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  canton?: string;
  ciudad?: string;
  whatsapp?: string;
  fotos?: string[];
  categoria?: string;
  subcategoria?: string;
  createdAt?: string;
  updatedAt?: string;
  vehiculoAno?: number;
  marchamoAlDia?: boolean;
  dekraAlDia?: boolean;
  dekraMes?: string;
};

const COLORS = {
  navy: "#0A2540",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
  danger: "#DC2626",
};

const CATEGORIAS = [
  "Muebles",
  "Electrodomésticos",
  "Tecnología",
  "Motos y vehículos",
  "Deportes & outdoor",
  "Hogar",
  "Alquiler de casas y apartamentos",
  "Otros",
] as const;

type Categoria = (typeof CATEGORIAS)[number];

const SUBCATEGORIAS: Record<Categoria, string[]> = {
  Muebles: ["Sala","Dormitorio","Cocina","Baño","Oficina","Exterior","Otros"],
  Electrodomésticos: ["Cocina","Limpieza","Clima","Pequeños","Otros"],
  Tecnología: ["Celulares","Ordenadores","Tablets","Consolas","Audio","TV","Accesorios","Otros"],
  "Motos y vehículos": ["Motos","Carros","Repuestos","Accesorios","Otros"],
  "Deportes & outdoor": ["Gimnasio","Ciclismo","Camping","Surf","Fútbol","Otros"],
  Hogar: ["Decoración","Iluminación","Ferretería","Jardín","Mascotas","Otros"],
  "Alquiler de casas y apartamentos": ["Casa","Apartamento","Habitación","Oficina","Otros"],
  Otros: ["Otros"],
};

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    outline: "none",
    fontWeight: 800,
    color: COLORS.text,
    width: "100%",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    fontWeight: 900,
    color: COLORS.text,
    width: "100%",
  };
}

function card(): React.CSSProperties {
  return {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(10,20,40,0.06)",
  };
}

function btnPrimary(disabled?: boolean): React.CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    border: `1px solid ${COLORS.navy}`,
    background: disabled ? COLORS.border : COLORS.navy,
    color: disabled ? "#7A8193" : "white",
    fontWeight: 950,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
    color: COLORS.text,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload",{method:"POST",body:fd});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data?.error || "Error subiendo foto");
  if(!data?.url) throw new Error("Upload sin URL");
  return String(data.url);
}

function onlyDigits(x:string){
  return String(x || "").replace(/\D/g,"");
}

export default function PublicarPage(){

  const [titulo,setTitulo]=useState("");
  const [precio,setPrecio]=useState("");
  const [provincia,setProvincia]=useState<(typeof PROVINCIAS)[number]>("San José");
  const [ciudad,setCiudad]=useState<string>(CANTONES["San José"]?.[0] || "");
  const [categoria,setCategoria]=useState<Categoria>("Muebles");
  const [subcategoria,setSubcategoria]=useState<string>(SUBCATEGORIAS["Muebles"][0] || "Otros");
  const [descripcion,setDescripcion]=useState("");
  const [whatsapp,setWhatsapp]=useState("");

  const [vehiculoAno,setVehiculoAno]=useState("");
  const [marchamoAlDia,setMarchamoAlDia]=useState("");
  const [dekraAlDia,setDekraAlDia]=useState("");
  const [dekraMes,setDekraMes]=useState("");

  const [files,setFiles]=useState<File[]>([]);
  const [previews,setPreviews]=useState<string[]>([]);

  const [guardando,setGuardando]=useState(false);
  const [error,setError]=useState<string | null>(null);

  const cantonesDisponibles = useMemo(()=>CANTONES[provincia] ?? [],[provincia]);
  const esVehiculo = categoria==="Motos y vehículos";

  async function publicar(e:React.FormEvent){
    e.preventDefault();
    if(guardando) return;

    setGuardando(true);
    setError(null);

    try{

      const precioNum=Number(precio);
      const ws=onlyDigits(whatsapp);

      const mod = moderarTexto({titulo,descripcion,categoria});
      if(!mod.ok) throw new Error(mod.mensaje);

      let fotos:string[]=[];
      for(const f of files){
        const url = await uploadToCloudinary(f);
        fotos.push(url);
      }

      const payload:any={
        titulo,
        descripcion,
        precio:precioNum,
        provincia,
        ciudad,
        categoria,
        subcategoria,
        whatsapp:ws,
        fotos:fotos.slice(0,5)
      };

      const res=await fetch("/api/anuncios",{
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });

      const data=await res.json();
      if(!res.ok) throw new Error(data?.error || "Error publicando");

      window.location.href=`/anuncio/${data.anuncio.id}`;

    }catch(err:any){
      setError(err?.message || "Error al publicar");
    }finally{
      setGuardando(false);
    }
  }

  return (
    <main className={inter.className} style={{background:COLORS.bg,minHeight:"100vh"}}>
      <div style={{maxWidth:760,margin:"0 auto",padding:"26px 16px 60px"}}>
        
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h1 style={{margin:0,fontSize:26,fontWeight:950}}>Publicar anuncio</h1>
          <Link href="/" style={btnGhost()}>← Volver</Link>
        </div>

        <div style={{...card(),marginTop:14}}>

          <form onSubmit={publicar} style={{display:"grid",gap:12}}>

            <input style={inputStyle()} placeholder="Título" value={titulo} onChange={e=>setTitulo(e.target.value)} />

            <input style={inputStyle()} placeholder="Precio (₡)" value={precio} onChange={e=>setPrecio(e.target.value)} />

            <textarea style={{...inputStyle(),minHeight:120}} placeholder="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} />

            <input style={inputStyle()} placeholder="WhatsApp" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} />

            {error && <div style={{color:COLORS.danger,fontWeight:900}}>{error}</div>}

            <button type="submit" disabled={guardando} style={btnPrimary(guardando)}>
              {guardando ? "Publicando..." : "Publicar"}
            </button>

          </form>

        </div>
      </div>
    </main>
  );
}