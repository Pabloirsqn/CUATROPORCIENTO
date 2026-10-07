import {sampleImages,type Property} from './real-estate';

export type ClientContact={name:string;agency:string;phone:string;email:string};
export function propertyPhotoUrls(p:Property){return Array.from(new Set([p.image,...(p.photos||[])])).filter(Boolean).slice(0,10)}
// Existing stored records keep their original photo URLs. Resolve the known
// demonstration images to bundled files without rewriting user publications.
const demoPhotos=['/demo-photos/garden.jpg','/demo-photos/interior.jpg','/demo-photos/residence.jpg'];
export function propertyPhotoSource(source:string){const index=sampleImages.indexOf(source);return index>=0?demoPhotos[index]:source}
export function propertyLocation(p:Property){return Array.from(new Set([p.zone,p.clientDetails?.neighborhood,p.clientDetails?.postalCode?'CP '+p.clientDetails.postalCode:'',p.clientDetails?.city||'León',p.clientDetails?.state||'Guanajuato'].filter(Boolean))).join(', ')}
export function clientSheetFilename(p:Property){const slug=p.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);return `cuatroporciento-${p.id}-${slug}.pdf`}
