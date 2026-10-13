import {Unzlib,zlibSync} from 'fflate';
// Worker-compatible, bounded PNG raster codec. No Node zlib private handles.
const signature=new Uint8Array([137,80,78,71,13,10,26,10]);
const ensure=(ok,code)=>{if(!ok)throw Error(code);};
const u32=(b,o)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(o);
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
export function decodePng(bytes,maxPixels=3000000){
 ensure(bytes.length>=33&&signature.every((b,i)=>bytes[i]===b),'ENGINE_PNG_MAGIC');
 let at=8,width,height,channels,type,palette=null,transparency=null;const compressed=[];let end=false;
 while(at+12<=bytes.length){const size=u32(bytes,at);ensure(size<=bytes.length-at-12,'ENGINE_PNG_CHUNK');const name=String.fromCharCode(...bytes.slice(at+4,at+8)),data=bytes.subarray(at+8,at+8+size);ensure(crc(bytes.subarray(at+4,at+8+size))===u32(bytes,at+8+size),'ENGINE_PNG_CRC');
  if(name==='IHDR'){ensure(at===8&&size===13,'ENGINE_PNG_HEADER');width=u32(data,0);height=u32(data,4);type=data[9];channels=({0:1,2:3,3:1,4:2,6:4})[type];ensure(width>0&&height>0&&width*height<=maxPixels&&data[8]===8&&channels&&data[10]===0&&data[11]===0&&data[12]===0,'ENGINE_PNG_DIMENSIONS_OR_FORMAT');}
  else if(name==='PLTE')palette=data.slice();else if(name==='tRNS')transparency=data.slice();else if(name==='IDAT')compressed.push(data);else if(name==='IEND'){ensure(size===0&&at+12===bytes.length,'ENGINE_PNG_TRAILING_DATA');end=true;break;}
  else ensure(!['acTL','fcTL','fdAT'].includes(name)&&(name.charCodeAt(0)&32),'ENGINE_PNG_UNKNOWN_CRITICAL_OR_ANIMATED');
  at+=size+12;
 }
 ensure(end&&compressed.length&&channels,'ENGINE_PNG_TRUNCATED');if(type===3)ensure(palette&&palette.length%3===0&&palette.length<=768,'ENGINE_PNG_PALETTE');
 const rowSize=width*channels,expected=(rowSize+1)*height,raw=new Uint8Array(expected);let written=0;
 const inflater=new Unzlib((chunk)=>{ensure(written+chunk.length<=expected,'ENGINE_PNG_INFLATE_LIMIT');raw.set(chunk,written);written+=chunk.length;});
 // Small input increments bound each decoder-produced chunk even for bombs.
 for(let i=0;i<compressed.length;i++)for(let o=0;o<compressed[i].length;o+=1024)inflater.push(compressed[i].subarray(o,o+1024),i===compressed.length-1&&o+1024>=compressed[i].length);
 ensure(written===expected,'ENGINE_PNG_INFLATE_LENGTH');const rgba=new Uint8Array(width*height*4);let previous=new Uint8Array(rowSize);
 for(let y=0;y<height;y++){const base=y*(rowSize+1),filter=raw[base];ensure(filter<=4,'ENGINE_PNG_FILTER');const row=new Uint8Array(rowSize);for(let x=0;x<rowSize;x++){const left=x>=channels?row[x-channels]:0,up=previous[x],upperLeft=x>=channels?previous[x-channels]:0,prediction=filter===0?0:filter===1?left:filter===2?up:filter===3?(left+up)>>>1:paeth(left,up,upperLeft);row[x]=(raw[base+1+x]+prediction)&255;}
  for(let x=0;x<width;x++){const s=x*channels,d=(y*width+x)*4;if(type===6){rgba.set(row.subarray(s,s+4),d);}else if(type===2){rgba[d]=row[s];rgba[d+1]=row[s+1];rgba[d+2]=row[s+2];rgba[d+3]=transparency&&row[s]===transparency[1]&&row[s+1]===transparency[3]&&row[s+2]===transparency[5]?0:255;}else if(type===3){const p=row[s]*3;ensure(p+2<palette.length,'ENGINE_PNG_PALETTE_INDEX');rgba[d]=palette[p];rgba[d+1]=palette[p+1];rgba[d+2]=palette[p+2];rgba[d+3]=transparency?.[row[s]]??255;}else{rgba[d]=rgba[d+1]=rgba[d+2]=row[s];rgba[d+3]=type===4?row[s+1]:(transparency&&row[s]===transparency[1]?0:255);}}
  previous=row;
 }return {width,height,data:rgba};
}
function chunk(name,data){const output=new Uint8Array(data.length+12),view=new DataView(output.buffer);view.setUint32(0,data.length);for(let i=0;i<4;i++)output[4+i]=name.charCodeAt(i);output.set(data,8);view.setUint32(data.length+8,crc(output.subarray(4,data.length+8)));return output;}
export function encodePng({width,height,data}){
 ensure(data.length===width*height*4,'ENGINE_PNG_RASTER');const rowSize=width*4,raw=new Uint8Array((rowSize+1)*height);
 for(let y=0;y<height;y++){const base=y*(rowSize+1),source=y*rowSize;raw[base]=1;for(let x=0;x<rowSize;x++)raw[base+1+x]=(data[source+x]-(x>=4?data[source+x-4]:0))&255;}
 const header=new Uint8Array(13),v=new DataView(header.buffer);v.setUint32(0,width);v.setUint32(4,height);header[8]=8;header[9]=6;
 const chunks=[signature,chunk('IHDR',header),chunk('IDAT',zlibSync(raw,{level:3})),chunk('IEND',new Uint8Array())],output=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let at=0;for(const c of chunks){output.set(c,at);at+=c.length;}return output;
}
