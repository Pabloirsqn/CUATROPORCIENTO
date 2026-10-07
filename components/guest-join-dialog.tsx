'use client';

import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Check,CheckCircle2,Clock3,RefreshCw,ShieldCheck,Ticket,Users} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import type {Identity,Member} from '@/lib/membership';

type Draft={name:string;agency:string;phone:string;code:string;at:number};
const draftKey='cf-join-draft-v1';

export function GuestJoinDialog({open,onOpenChange,signInHref}:{open:boolean;onOpenChange:(open:boolean)=>void;signInHref:string}){
 const [user,setUser]=useState<Identity|null>(null),[member,setMember]=useState<Member|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [mode,setMode]=useState<'request'|'invitation'>('request'),[pendingView,setPendingView]=useState(false);
 const [name,setName]=useState(''),[agency,setAgency]=useState(''),[phone,setPhone]=useState(''),[code,setCode]=useState('');
 const formRef=useRef<HTMLFormElement>(null),signInRef=useRef<HTMLAnchorElement>(null);
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();setLoading(true);setError('');
  let draft:Draft|null=null;
  try{const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');if(saved&&Date.now()-saved.at<30*60*1000&&['name','agency','phone','code'].every(k=>typeof saved[k]==='string'))draft=saved;else sessionStorage.removeItem(draftKey)}catch{}
  const invitation=new URLSearchParams(window.location.search).get('codigo')?.slice(0,80)||draft?.code||'';
  if(draft){setName(draft.name);setAgency(draft.agency);setPhone(draft.phone)}
  if(invitation){setCode(invitation);setMode('invitation')}
  void fetch('/api/access',{cache:'no-store',signal:controller.signal}).then(async response=>{
   const data=await response.json() as {user:Identity|null;member:Member|null;error?:string};
   if(!response.ok)throw Error(data.error||'No pudimos consultar tu cuenta.');
   if(controller.signal.aborted)return;
   setUser(data.user);setMember(data.member);setPendingView(data.member?.status==='Pendiente'&&!invitation);
   if(data.member){setName(data.member.name);setAgency(data.member.agency);setPhone(data.member.phone)}
  }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'No pudimos consultar tu cuenta.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[open]);
 function preserveDraft(){try{sessionStorage.setItem(draftKey,JSON.stringify({name,agency,phone,code:mode==='invitation'?code:'',at:Date.now()}))}catch{}}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!user){signInRef.current?.click();return;}
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,agency,phone,code:mode==='invitation'?code:''})});
   const data=await response.json() as {member:Member|null;error?:string};
   if(!response.ok)throw Error(data.error||'No pudimos guardar tu solicitud.');
   setMember(data.member);setPendingView(data.member?.status==='Pendiente');try{sessionStorage.removeItem(draftKey)}catch{}
  }catch(e){setError(e instanceof Error?e.message:'No pudimos guardar tu solicitud. Tus datos siguen aquí.')}
  finally{setBusy(false)}
 }
 async function refresh(){setBusy(true);setError('');try{const response=await fetch('/api/access',{cache:'no-store'});const data=await response.json() as {user:Identity|null;member:Member|null;error?:string};if(!response.ok)throw Error(data.error||'No pudimos consultar tu cuenta.');setUser(data.user);setMember(data.member);setPendingView(data.member?.status==='Pendiente')}catch(e){setError(e instanceof Error?e.message:'No pudimos consultar tu cuenta.')}finally{setBusy(false)}}
 const active=member?.status==='Activo',blocked=member?.status==='Suspendido'||member?.status==='Rechazado';
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="join-dialog brand-overlay" onCloseAutoFocus={event=>{event.preventDefault();document.querySelector<HTMLButtonElement>('.join-trigger')?.focus()}}><DialogHeader><span className="join-kicker"><Users size={17}/>Forma parte de la red</span><DialogTitle>{active?'Ya eres parte de cuatroporciento':pendingView?'Solicitud recibida':'Tu próximo negocio empieza aquí'}</DialogTitle><DialogDescription>Publica propiedades, encuentra lo que busca tu cliente y colabora con otros asesores.</DialogDescription></DialogHeader>
  {loading?<div className="join-loading" role="status">Consultando tu cuenta…</div>:error&&!user&&!member?<div className="join-status"><p className="form-error" role="alert">{error}</p><button className="btn secondary" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/>Reintentar</button></div>:active?<div className="join-status" role="status"><CheckCircle2 size={38}/><h3>Acceso habilitado</h3><p>{member.name}, ya puedes publicar y colaborar con la red.</p><a href="/inventario" className="btn">Entrar a mi plataforma</a></div>:blocked?<div className="join-status"><ShieldCheck size={38}/><h3>{member.status==='Suspendido'?'Acceso suspendido':'Registro no autorizado'}</h3><p>Un administrador debe revisar tu cuenta para habilitar tu acceso.</p>{member.reviewNote&&<p>{member.reviewNote}</p>}<button className="btn secondary" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/>Consultar estado</button></div>:pendingView?<div className="join-status" role="status"><Clock3 size={38}/><h3>Tu registro está en revisión</h3><p>Un administrador validará tu perfil. Mientras tanto puedes seguir explorando como invitado.</p><button className="btn" onClick={()=>{setMode('invitation');setPendingView(false)}}><Ticket size={17}/>Tengo un código de invitación</button><button className="btn secondary" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/>Consultar estado</button></div>:<>
   <div className="join-benefits">{['Publica tu inventario','Recibe alertas de propiedades','Colabora con la red'].map(text=><span key={text}><Check size={15}/>{text}</span>)}</div>
   <div className="join-options" role="group" aria-label="Elige cómo unirte"><button type="button" aria-pressed={mode==='request'} onClick={()=>setMode('request')}><Users size={18}/><span>Solicitar acceso<small>Validación por un administrador</small></span></button><button type="button" aria-pressed={mode==='invitation'} onClick={()=>setMode('invitation')}><Ticket size={18}/><span>Tengo un código<small>Alta con invitación válida</small></span></button></div>
   <form ref={formRef} className="join-form" onSubmit={submit}>
    {user&&<p className="join-account">Cuenta de acceso: <strong>{user.email}</strong></p>}
    <div className="field"><label htmlFor="join-name">Nombre completo</label><input id="join-name" value={name} onChange={e=>setName(e.target.value)} required minLength={3} maxLength={140} autoComplete="name"/></div>
    <div className="field"><label htmlFor="join-agency">Agencia o asesor independiente</label><input id="join-agency" value={agency} onChange={e=>setAgency(e.target.value)} required minLength={2} maxLength={140} autoComplete="organization" placeholder="Ej. Asesor independiente"/></div>
    <div className="field"><label htmlFor="join-phone">Teléfono</label><input id="join-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required minLength={7} maxLength={30} autoComplete="tel"/></div>
    {mode==='invitation'&&<div className="field join-code"><label htmlFor="join-code"><Ticket size={16}/>Código de invitación</label><input id="join-code" value={code} onChange={e=>setCode(e.target.value)} required maxLength={80} placeholder="CF-…" autoComplete="off"/><small>Personal y de un solo uso. Inicia sesión con el correo al que está asignado.</small></div>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    {user?<button className="btn join-submit" disabled={busy||!!member&&mode==='request'}>{busy?'Guardando…':mode==='invitation'?'Validar código y activar acceso':'Enviar solicitud de acceso'}</button>:<a ref={signInRef} href={signInHref} target="_top" className="btn join-submit" onClick={event=>{if(!formRef.current?.reportValidity()){event.preventDefault();return;}preserveDraft()}}>Continuar con ChatGPT</a>}
    <p className="join-explanation">{user?(mode==='invitation'?'Una invitación válida para tu correo habilita tu acceso al confirmar.':'Tu solicitud queda pendiente hasta la aprobación de un administrador.'):'Confirma tu cuenta con ChatGPT y regresa a este formulario con tus datos guardados.'}</p>
   </form>
  </>}
  {error&&(active||blocked||pendingView)&&<p className="form-error" role="alert">{error}</p>}
  <button className="join-browse" type="button" onClick={()=>onOpenChange(false)}>Seguir explorando como invitado</button>
 </DialogContent></Dialog>;
}
