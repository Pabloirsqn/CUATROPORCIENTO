import {PDFDocument,rgb,clip,endPath,rectangle,pushGraphicsState,popGraphicsState,type PDFPage,type PDFFont,type PDFImage} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {Property} from './real-estate';
import {propertyLocation,type ClientContact} from './client-sheet';

export type PdfPhoto={bytes:Uint8Array;format:'jpeg'|'png'};
export type ClientPdfInput={property:Property;contact:ClientContact;photos:PdfPhoto[];logo:Uint8Array;mark:Uint8Array;textMark:Uint8Array;fontRegular:Uint8Array;fontBold:Uint8Array;includeAddress:boolean;date?:Date};
const W=612,H=792,M=44,CW=W-2*M;
const ink=rgb(17/255,19/255,12/255),lime=rgb(203/255,1,48/255),muted=rgb(.39,.43,.37),soft=rgb(.95,.96,.93),line=rgb(.85,.88,.82),white=rgb(1,1,1);

// Keep searchable text rather than screenshots. Unsupported emoji are removed,
// while Spanish accents, ñ, currency and measurements remain intact.
const characterSets=new WeakMap<PDFFont,Set<number>>();
function printable(value:string,font:PDFFont){let chars=characterSets.get(font);if(!chars){chars=new Set(font.getCharacterSet());characterSets.set(font,chars)}let out='';for(const c of value.normalize('NFC').replace(/\r/g,'').replace(/[\u0000-\u0009\u000b-\u001f]/g,' ')){if(c==='\n'){out+=c;continue}out+=chars.has(c.codePointAt(0)!)?c:' '}return out}
function wrap(value:string,font:PDFFont,size:number,width:number){const lines:string[]=[];for(const paragraph of printable(value,font).split('\n')){if(!paragraph.trim()){lines.push('');continue}let current='';for(const word of paragraph.trim().split(/\s+/)){if(font.widthOfTextAtSize(word,size)>width){if(current){lines.push(current);current=''}let part='';for(const char of word){if(font.widthOfTextAtSize(part+char,size)>width){lines.push(part);part=''}part+=char}current=part;continue}const next=current?current+' '+word:word;if(font.widthOfTextAtSize(next,size)>width){lines.push(current);current=word}else current=next}if(current)lines.push(current)}return lines}

export async function createClientPdf(input:ClientPdfInput):Promise<Uint8Array>{
 const {property:p,contact,photos}=input;
 if(!photos.length||photos.length>10)throw Error('La ficha necesita entre una y diez fotografías.');
 const doc=await PDFDocument.create();
 doc.registerFontkit(fontkit);
 const regular=await doc.embedFont(input.fontRegular,{subset:true}),bold=await doc.embedFont(input.fontBold,{subset:true});
 const logo=await doc.embedPng(input.logo),mark=await doc.embedPng(input.mark),textMark=await doc.embedPng(input.textMark);
 const images:PDFImage[]=[];for(const photo of photos)images.push(photo.format==='png'?await doc.embedPng(photo.bytes):await doc.embedJpg(photo.bytes));
 const date=input.date||new Date(),dateText=date.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric',timeZone:'America/Mexico_City'});
 doc.setTitle(p.title+' | cuatroporciento');doc.setAuthor(contact.name);doc.setCreator('cuatroporciento');doc.setLanguage('es-MX');doc.setCreationDate(date);
 const text=(page:PDFPage,value:string,x:number,y:number,size=11,font=regular,color=ink)=>page.drawText(printable(value,font),{x,y,size,font,color});
 const fit=(page:PDFPage,value:string,x:number,y:number,width:number,size=11,font=regular,color=ink)=>{let s=size;while(s>8&&font.widthOfTextAtSize(printable(value,font),s)>width)s-=.25;text(page,value,x,y,s,font,color)};
 const brand=(page:PDFPage,cover=false)=>{if(cover)page.drawRectangle({x:0,y:710,width:W,height:82,color:lime});const width=cover?236:202;page.drawImage(logo,{x:M,y:cover?729:728,width,height:width/logo.width*logo.height});text(page,cover?'FICHA DE PROPIEDAD':'CUATROPORCIENTO',414,cover?758:754,9,bold);fit(page,p.id,414,cover?742:738,150,10);if(!cover){page.drawLine({start:{x:M,y:713},end:{x:W-M,y:713},thickness:.7,color:line});page.drawImage(textMark,{x:345,y:218,width:205,height:205/textMark.width*textMark.height,opacity:.055})}};
 const photo=(page:PDFPage,image:PDFImage,x:number,y:number,w:number,h:number,cover=false)=>{page.drawRectangle({x,y,width:w,height:h,color:soft});const scale=cover?Math.max(w/image.width,h/image.height):Math.min(w/image.width,h/image.height);page.pushOperators(pushGraphicsState(),rectangle(x,y,w,h),clip(),endPath());page.drawImage(image,{x:x+(w-image.width*scale)/2,y:y+(h-image.height*scale)/2,width:image.width*scale,height:image.height*scale});page.pushOperators(popGraphicsState());const mw=Math.min(126,w*.28);page.drawImage(mark,{x:x+(w-mw)/2,y:y+(h-mw/mark.width*mark.height)/2,width:mw,height:mw/mark.width*mark.height,opacity:.2});const bw=Math.min(171,w*.43),bh=bw/logo.width*logo.height;page.drawRectangle({x:x+w-bw-20,y:y+10,width:bw+12,height:bh+10,color:white,opacity:.84});page.drawImage(logo,{x:x+w-bw-14,y:y+15,width:bw,height:bh,opacity:.72})};

 // Cover: one strong photograph, price and six scannable facts.
 const cover=doc.addPage([W,H]);brand(cover,true);
 text(cover,p.operation.toUpperCase()+' / '+p.type.toUpperCase(),M,689,11,bold);
 let titleSize=25,titleLines=wrap(p.title,bold,titleSize,CW);while(titleLines.length>3&&titleSize>18){titleSize--;titleLines=wrap(p.title,bold,titleSize,CW)}
 let y=663;for(const title of titleLines){text(cover,title,M,y,titleSize,bold);y-=titleSize+4}
 y-=3;for(const place of wrap(propertyLocation(p),regular,11,CW)){text(cover,place,M,y,11,regular,muted);y-=14}
 const heroTop=y-9;photo(cover,images[0],M,368,CW,heroTop-368,true);
 cover.drawRectangle({x:M,y:276,width:CW,height:78,color:ink});
 text(cover,p.operation==='Renta'?'RENTA MENSUAL':'PRECIO DE VENTA',M+17,331,9,bold,lime);
 fit(cover,'$'+p.price.toLocaleString('es-MX'),M+17,296,CW-135,31,bold,white);
 text(cover,p.operation==='Renta'?'MXN / mes':'MXN',W-M-91,301,11,regular,white);
 const facts:[[string,string],[string,string],[string,string],[string,string],[string,string],[string,string]]=[['Recámaras',String(p.beds)],['Baños',String(p.baths)],['Estacionamientos',String(p.parking)],['Construcción',p.area.toLocaleString('es-MX')+' m²'],['Terreno',p.land?p.land.toLocaleString('es-MX')+' m²':'No aplica'],['Disponibilidad',p.status]];
 facts.forEach(([label,value],i)=>{const col=i%3,row=Math.floor(i/3),x=M+col*(CW/3),baseline=245-row*57;text(cover,label,x,baseline-18,9,regular,muted);fit(cover,value,x,baseline,CW/3-13,i===5?13:21,bold);if(col<2)cover.drawLine({start:{x:x+CW/3-14,y:baseline-22},end:{x:x+CW/3-14,y:baseline+14},thickness:.6,color:line})});
 cover.drawRectangle({x:M,y:63,width:CW,height:77,color:soft});
 text(cover,'TU ASESOR',M+14,122,8,bold,muted);fit(cover,contact.name,M+14,104,CW-28,13,bold);fit(cover,contact.agency,M+14,88,CW-28,10,regular,muted);
 fit(cover,[contact.phone,contact.email].filter(Boolean).join('  |  '),M+14,73,CW-28,10);

 // Detail pages flow with measured line wrapping; long descriptions continue
 // onto additional pages rather than being clipped or truncated.
 let page:PDFPage,yDetail=0;
 const detailPage=(title='La propiedad, en detalle')=>{page=doc.addPage([W,H]);brand(page);text(page,title,M,683,23,bold);yDetail=652};
 detailPage();
 const ensure=(height:number)=>{if(yDetail-height<79)detailPage('Detalles de la propiedad')};
 const section=(title:string,body:string)=>{if(!body.trim())return;const lines=wrap(body,regular,11.5,CW);ensure(51);text(page,title,M,yDetail,16,bold);yDetail-=27;for(const row of lines){if(yDetail<84){detailPage();text(page,title+' / continuación',M,yDetail,14,bold);yDetail-=26}if(row)text(page,row,M,yDetail,11.5);yDetail-=16}yDetail-=18};
 const rows=(title:string,values:[string,string][])=>{ensure(67);text(page,title,M,yDetail,16,bold);yDetail-=25;for(let i=0;i<values.length;i+=2){const pair=values.slice(i,i+2);const heights=pair.map(([,value])=>wrap(value,regular,11,CW/2-22).length*15+24);const height=Math.max(...heights);ensure(height+10);pair.forEach(([label,value],col)=>{const x=M+col*(CW/2+7);text(page,label,x,yDetail,9,bold,muted);wrap(value,regular,11,CW/2-22).forEach((row,j)=>text(page,row,x,yDetail-18-j*15,11))});yDetail-=height+12}yDetail-=9};
 rows('Características adicionales',[['Jardín',p.garden?'Sí':'No'],['Alberca',p.pool?'Sí':'No'],...(p.clientDetails?.furnishing?[['Amueblado',p.clientDetails.furnishing] as [string,string]]:[]),...(p.operation==='Renta'||p.clientDetails?.maintenance?[['Mantenimiento',p.clientDetails?.maintenance||'Por confirmar'] as [string,string]]:[])]);
 if(input.includeAddress&&p.clientDetails?.address)section('Dirección',p.clientDetails.address);
 section('Descripción',p.description||'Descripción no registrada.');
 section('Distribución',p.clientDetails?.distribution||'');
 section('Equipamiento y amenidades',p.clientDetails?.equipment||'');
 section('Condiciones de '+p.operation.toLowerCase(),p.clientDetails?.terms||'');

 // Full photographs are fitted inside their frame, preserving their proportions.
 for(let i=1;i<images.length;i+=2){const gallery=doc.addPage([W,H]);brand(gallery);text(gallery,'Conoce los espacios',M,681,24,bold);text(gallery,'GALERÍA / '+String(images.length)+' FOTOGRAFÍAS',M,657,9,bold,muted);const count=Math.min(2,images.length-i),h=count===1?520:253;for(let j=0;j<count;j++){const bottom=count===1?105:366-j*285;photo(gallery,images[i+j],M,bottom,CW,h);text(gallery,'FOTOGRAFÍA '+String(i+j+1).padStart(2,'0')+' / '+String(images.length).padStart(2,'0'),M,bottom-16,9,regular,muted)}}
 const pages=doc.getPages();pages.forEach((page,i)=>{page.drawLine({start:{x:M,y:49},end:{x:W-M,y:49},thickness:.6,color:line});text(page,'cuatroporciento / '+p.id,M,32,8,bold,muted);text(page,(i+1)+' / '+pages.length,W-M-27,32,8,regular,muted);fit(page,dateText+' · Precio y disponibilidad sujetos a confirmación.',M,17,CW-55,8,regular,muted)});
 return doc.save();
}
