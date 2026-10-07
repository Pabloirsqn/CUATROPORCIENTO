'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Download,FileText,LoaderCircle,ExternalLink,ShieldCheck} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {toast} from 'sonner';
import {money,type Property} from '@/lib/real-estate';
import {clientSheetFilename,propertyPhotoUrls,propertyPhotoSource,propertyLocation,type ClientContact} from '@/lib/client-sheet';
import type {PdfPhoto} from '@/lib/client-pdf';

async function preparePhoto(blob:Blob):Promise<PdfPhoto>{
 let source:ImageBitmap|HTMLImageElement;
 try{source=await createImageBitmap(blob)}catch{
  const url=URL.createObjectURL(blob);
  try{source=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('La fotografía no se pudo abrir.'));img.src=url})}finally{URL.revokeObjectURL(url)}
 }
 try{const width=source instanceof HTMLImageElement?source.naturalWidth:source.width,height=source instanceof HTMLImageElement?source.naturalHeight:source.height;const scale=Math.min(1,1800/Math.max(width,height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Tu navegador no pudo preparar las imágenes.');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);const jpeg=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('No se pudo preparar la fotografía.')),'image/jpeg',.9));return {bytes:new Uint8Array(await jpeg.arrayBuffer()),format:'jpeg'}}finally{if('close' in source)source.close()}
}

export function ClientSheet({property:p,contact:initial}:{property:Property;contact:ClientContact}){
 const [contact,setContact]=useState(initial),[includeAddress,setIncludeAddress]=useState(false),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 const [prepared,setPrepared]=useState<{url:string;filename:string}|null>(null);
 const alive=useRef(true),controller=useRef<AbortController|null>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort()}},[]);
 useEffect(()=>()=>{if(prepared)URL.revokeObjectURL(prepared.url)},[prepared]);
 const photos=propertyPhotoUrls(p);
 function change(field:keyof ClientContact,value:string){setContact(old=>({...old,[field]:value}));setPrepared(null);setError('')}
 async function generate(e:FormEvent){
  e.preventDefault();if(busy)return;
  if(!contact.name.trim()||(!contact.phone.trim()&&!contact.email.trim())){setError('Indica el nombre y al menos un teléfono o correo de contacto.');return}
  setBusy(true);setPrepared(null);setError('');const abort=new AbortController();controller.current=abort;
  try{
   const pdf=await import('@/lib/client-pdf');const ready:PdfPhoto[]=[];
   for(let i=0;i<photos.length;i++){if(!alive.current)return;setProgress(`Preparando foto ${i+1} de ${photos.length}…`);const url=propertyPhotoSource(photos[i]);if(!url.startsWith('/demo-photos/')&&!url.startsWith('/api/photos/'))throw Error('Esta fotografía no está disponible en la plataforma.');const r=await fetch(url,{signal:AbortSignal.any([abort.signal,AbortSignal.timeout(25000)])});if(!r.ok)throw Error(`No se pudo cargar la foto ${i+1}. Intenta de nuevo; se conservarán los datos.`);const blob=await r.blob();if(blob.size>8*1024*1024)throw Error('Una fotografía excede el tamaño permitido.');ready.push(await preparePhoto(blob))}
   if(!alive.current)return;setProgress('Armando tu ficha…');
   const [logo,mark,textMark,fontRegular,fontBold]=await Promise.all(['/brand/logo-negro.png','/brand/isotipo-lima.png','/brand/isotipo-negro.png','/brand/fonts/regular.ttf','/brand/fonts/bold.ttf'].map(async path=>{const r=await fetch(path,{signal:abort.signal});if(!r.ok)throw Error('No se pudo cargar la identidad de cuatroporciento.');return new Uint8Array(await r.arrayBuffer())}));
   const bytes=await pdf.createClientPdf({property:p,contact,photos:ready,logo,mark,textMark,fontRegular,fontBold,includeAddress});if(!alive.current)return;
   const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'})),filename=clientSheetFilename(p);setPrepared({url,filename});const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();toast.success('Ficha PDF lista para compartir');
  }catch(err){if(alive.current&&!abort.signal.aborted){const message=err instanceof Error?err.message:'No se pudo generar el PDF. Intenta de nuevo.';setError(message);toast.error(message)}}finally{if(alive.current){setBusy(false);setProgress('')}}
 }
 return <form onSubmit={generate} className="client-pdf-form">
  <div className="pdf-cover-preview"><div className="pdf-preview-brand"><img src="/brand/logo-negro.png" alt="cuatroporciento"/><span>FICHA PARA CLIENTE</span></div><div className="pdf-preview-photo"><img src={propertyPhotoSource(p.image)} alt={p.title}/><img className="pdf-preview-watermark" src="/brand/isotipo-lima.png" alt=""/></div><div className="pdf-preview-summary"><span className="eyebrow">{p.operation} · {p.type} · {p.id}</span><h3>{p.title}</h3><p>{propertyLocation(p)}</p><strong>{money(p.price)} <small>MXN{p.operation==='Renta'?' / mes':''}</small></strong><div className="pdf-preview-facts"><span>{p.beds} recámaras</span><span>{p.baths} baños</span><span>{p.parking} autos</span><span>{p.area} m² construcción</span></div></div></div>
  <div className="pdf-includes"><FileText size={19}/><p><strong>{photos.length} {photos.length===1?'fotografía':'fotografías'} con marca de agua</strong><span>Precio, superficies, descripción, características y los detalles registrados de la propiedad.</span></p></div>
  <div className="form-section-title">Contacto que verá tu cliente</div>
  <p className="form-caption">Se usa tu perfil activo. En esta demo puedes reemplazar los datos antes de descargar.</p>
  <fieldset disabled={busy} className="form-grid pdf-contact-fields"><div className="field"><label htmlFor="pdf-name">Nombre del asesor</label><input id="pdf-name" required maxLength={100} value={contact.name} onChange={e=>change('name',e.target.value)}/></div><div className="field"><label htmlFor="pdf-agency">Inmobiliaria / marca</label><input id="pdf-agency" maxLength={100} value={contact.agency} onChange={e=>change('agency',e.target.value)}/></div><div className="field"><label htmlFor="pdf-phone">Teléfono / WhatsApp</label><input id="pdf-phone" type="tel" maxLength={50} value={contact.phone} onChange={e=>change('phone',e.target.value)} placeholder="Tu número de contacto"/></div><div className="field"><label htmlFor="pdf-email">Correo</label><input id="pdf-email" type="email" maxLength={150} value={contact.email} onChange={e=>change('email',e.target.value)}/></div></fieldset>
  {p.clientDetails?.address&&<label className="inline-check pdf-address"><Checkbox checked={includeAddress} disabled={busy} onCheckedChange={v=>{setIncludeAddress(v===true);setPrepared(null)}}/>Incluir dirección: {p.clientDetails.address}</label>}
  <div className="pdf-private-note"><ShieldCheck size={17}/><span>La ficha no incluye comisiones ni conversaciones de colaboración.</span></div>
  {error&&<p className="pdf-error" role="alert">{error}</p>}
  <div className="form-footer pdf-download-actions"><span aria-live="polite">{busy?progress:'PDF con texto seleccionable e imágenes integradas.'}</span><button type="submit" className="btn" disabled={busy||!photos.length}>{busy?<LoaderCircle className="spin" size={17}/>:<Download size={17}/>} {busy?'Preparando…':'Descargar PDF'}</button></div>
  {prepared&&<div className="pdf-ready"><div className="row between"><strong>Tu ficha está lista</strong><div className="row"><a className="text-link row" href={prepared.url} download={prepared.filename}><Download size={15}/>Descargar otra vez</a><a className="text-link row" href={prepared.url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir PDF</a></div></div><iframe title="Vista previa de la ficha PDF para cliente" src={prepared.url}/></div>}
 </form>
}
