import {makeNode,type CanvasNode} from "./model";

export const SECTION_PRESETS=[
  {id:"editorial-split",name:"Editorial split",description:"Two-column story with a photograph"},
  {id:"feature-cards",name:"Three feature cards",description:"Responsive capability or service highlights"},
  {id:"photo-gallery",name:"Photo gallery",description:"Three-image editorial gallery"},
  {id:"full-bleed",name:"Full-width visual",description:"Wide photograph with headline and supporting copy"},
] as const;
export type SectionPresetId=typeof SECTION_PRESETS[number]["id"];

export function createSectionPreset(id:SectionPresetId):CanvasNode{
  const root=makeNode("section");
  root.name=SECTION_PRESETS.find(p=>p.id===id)?.name||"Editable section";
  root.styles.desktop={...root.styles.desktop,padding:"96px 6.3vw",
    background:"#0D2F49"};
  root.styles.mobile={padding:"52px 24px"};
  const container=()=>{
    const node=makeNode("container");
    node.styles.desktop={display:"grid",columns:2,gap:"48px",align:"center",
      maxWidth:"1320px",margin:"0px auto"};
    node.styles.tablet={gap:"28px"};
    node.styles.mobile={columns:1,gap:"28px"};
    return node;
  };
  const heading=(text:string,accent="")=>{
    const node=makeNode("heading");
    node.props.text=text;
    node.props.accent=accent;
    return node;
  };
  const body=(text:string)=>{
    const node=makeNode("text");node.props.text=text;return node;
  };
  if(id==="editorial-split"){
    const columns=container();
    const copy=makeNode("container");
    copy.name="Story copy";
    copy.children=[heading("Built with purpose.","Made to connect."),
      body("Tell your story here. Every detail can be tailored to the experience.")];
    const photo=makeNode("image");
    photo.name="Feature photograph";
    columns.children=[copy,photo];
    root.children=[columns];
  }else if(id==="feature-cards"){
    root.children=[heading("What we bring.","Together.")];
    const cards=container();
    cards.name="Three-column cards";
    cards.styles.desktop={display:"grid",columns:3,gap:"20px",
      maxWidth:"1320px",margin:"0px auto"};
    cards.styles.tablet={columns:2,gap:"16px"};
    cards.styles.mobile={columns:1,gap:"16px"};
    cards.children=["Strategy","Design","Delivery"].map((name)=>{
      const card=makeNode("container");
      card.name=name+" card";
      card.styles.desktop={display:"flex",direction:"column",gap:"12px",
        padding:"32px",background:"#123D55",minHeight:"220px"};
      const title=heading(name);title.props.accent="";
      title.props.level="h3";
      title.styles.desktop={...title.styles.desktop,fontSize:"28px"};
      title.styles.mobile={fontSize:"25px"};
      card.children=[title,body("Add a concise description of this capability.")];
      return card;
    });
    root.children.push(cards);
  }else if(id==="photo-gallery"){
    root.children=[heading("The moments.","That matter."),
      body("A closer look at the details behind the work.")];
    const gallery=makeNode("gallery");
    gallery.name="Editable photo gallery";
    gallery.props.items=["A","B","C"].map(label=>({
      id:makeNode("image").id,title:"",body:"",
      src:"/media/planning.webp",alt:"Gallery photograph "+label,
    }));
    gallery.styles.desktop={display:"grid",columns:3,gap:"20px"};
    gallery.styles.tablet={columns:2,gap:"16px"};
    gallery.styles.mobile={columns:1,gap:"16px"};
    root.children.push(gallery);
  }else if(id==="full-bleed"){
    root.styles.desktop={...root.styles.desktop,padding:"0px",
      background:"#0D2F49"};
    root.styles.mobile={padding:"0px"};
    const photo=makeNode("image");
    photo.name="Wide visual";
    photo.styles.desktop={width:"100%",height:"540px",objectFit:"cover",
      objectPosition:"50% 50%"};
    photo.styles.mobile={height:"300px"};
    const copy=makeNode("container");
    copy.name="Wide visual copy";
    copy.styles.desktop={padding:"72px 6.3vw",gap:"20px",
      display:"flex",direction:"column"};
    copy.styles.mobile={padding:"40px 24px"};
    copy.children=[heading("One clear idea.","Endless possibility."),
      body("Add a considered description that brings this section to life.")];
    root.children=[photo,copy];
  }
  return root;
}
