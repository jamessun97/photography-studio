export function relativeEV(aperture:number,shutter:number,iso:number){return Math.log2((4/aperture)**2*(shutter/(1/125))*(iso/400));}
export function printCm(pixels:number,ppi:number){return pixels/ppi*2.54;}
export function cropRect(width:number,height:number,ratio:number|null,zoom:number,x:number,y:number){
 let w=width,h=height;if(ratio){if(w/h>ratio)w=h*ratio;else h=w/ratio;}w/=zoom;h/=zoom;
 return {x:(width-w)*x/100,y:(height-h)*y/100,width:w,height:h};
}
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const linear=(x:number)=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const display=(x:number)=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
export type Edits={exposure:number;contrast:number;shadows:number;highlights:number;warmth:number;tint:number;saturation:number};
export function adjustPixels(pixels:Uint8ClampedArray,e:Edits){
 const histogram=new Array<number>(64).fill(0);let black=0,white=0;
 for(let i=0;i<pixels.length;i+=4){
  let r=linear(pixels[i]/255)*2**e.exposure,g=linear(pixels[i+1]/255)*2**e.exposure,b=linear(pixels[i+2]/255)*2**e.exposure;
  r*=2**(e.warmth/180+e.tint/360);b*=2**(-e.warmth/180+e.tint/360);g*=2**(-e.tint/180);
  let l=.2126*r+.7152*g+.0722*b;const shadow=(1-clamp(l))**3*e.shadows/180;const highlight=clamp(l)**2*e.highlights/180;
  const gain=2**(shadow+highlight);r*=gain;g*=gain;b*=gain;
  r=display(clamp(r));g=display(clamp(g));b=display(clamp(b));l=.2126*r+.7152*g+.0722*b;
  const sat=e.saturation/100,con=1+e.contrast/100;
  r=clamp(((l+(r-l)*sat)-.5)*con+.5);g=clamp(((l+(g-l)*sat)-.5)*con+.5);b=clamp(((l+(b-l)*sat)-.5)*con+.5);
  pixels[i]=Math.round(r*255);pixels[i+1]=Math.round(g*255);pixels[i+2]=Math.round(b*255);
  l=.2126*r+.7152*g+.0722*b;histogram[Math.min(63,Math.floor(l*64))]++;if(l<1/255)black++;if(l>254/255)white++;
 }
 return {histogram,black,white,total:pixels.length/4};
}
