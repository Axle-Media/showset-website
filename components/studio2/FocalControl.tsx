"use client";
import type {Breakpoint} from "@/lib/studio2/model";
import {focalValue,parseFocal} from "@/lib/studio2/image-focal";

export default function FocalControl({
  src,position,fit,breakpoint,onPosition,onFit,
}:{
  src:string;
  position:string;
  fit:"cover"|"contain";
  breakpoint:Breakpoint;
  onPosition:(value:string)=>void;
  onFit?:(fit:"cover"|"contain")=>void;
}){
  const {x,y}=parseFocal(position);
  const put=(nextX:number,nextY:number)=>onPosition(focalValue(nextX,nextY));
  return <div className="s2-focal-control" aria-label="Image crop and focal point">
    <div className="s2-focal-heading">
      <strong>Image crop and focus</strong>
      <span>{breakpoint} · non-destructive</span>
    </div>
    <button type="button" className="s2-focal-preview"
      aria-label="Set the image focal point by clicking the photograph"
      title="Click the subject you want to keep in frame"
      onClick={event=>{
        const rect=event.currentTarget.getBoundingClientRect();
        if(rect.width&&rect.height)
          put((event.clientX-rect.left)*100/rect.width,
              (event.clientY-rect.top)*100/rect.height);
      }}>
      {src ? <img src={src} alt="" draggable={false} style={{
        objectFit:fit,objectPosition:focalValue(x,y),
      }}/> : <span>No photograph selected</span>}
      <span aria-hidden="true" className="s2-focal-crosshair"
        style={{left:x+"%",top:y+"%"}}/>
    </button>
    <p className="s2-hint">Click the subject to set the focus, or adjust the sliders. The original image is never cropped or overwritten.</p>
    <label className="s2-focal-slider">
      Horizontal focus <output>{Math.round(x)}%</output>
      <input type="range" min={0} max={100} step={1} value={x}
        onChange={e=>put(Number(e.target.value),y)}/>
    </label>
    <label className="s2-focal-slider">
      Vertical focus <output>{Math.round(y)}%</output>
      <input type="range" min={0} max={100} step={1} value={y}
        onChange={e=>put(x,Number(e.target.value))}/>
    </label>
    {onFit && <label className="s2-field">Image fit
      <select aria-label="Image fit" value={fit}
        onChange={e=>onFit(e.target.value as "cover"|"contain")}>
        <option value="cover">Fill frame (crop)</option>
        <option value="contain">Show entire image</option>
      </select>
    </label>}
    <button type="button" className="s2-secondary" onClick={()=>put(50,50)}>
      Centre focus
    </button>
  </div>;
}
