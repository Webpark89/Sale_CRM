import React, { useState, useRef, useMemo } from "react";
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { STATUSES, STATUS_COLORS, STATUS_ENUM } from "../constants/status";
import { RG } from "../constants/theme";
import { today } from "../crmHelpers/helpers";
import { toJpeg, toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { inputStyle } from "../components/common/styles";
import Modal from "../components/common/Modal";

const getPresetRange = (preset) => {
  const d = new Date();
  const fmt = (date) => { const off = date.getTimezoneOffset()*60000; return new Date(date.getTime()-off).toISOString().split('T')[0]; };
  const t = fmt(d);
  if (preset==='today') return {min:t,max:t};
  if (preset==='last6months') { const p=new Date(d.getFullYear(),d.getMonth()-5,1); return {min:fmt(p),max:t}; }
  if (preset==='thismonth') { return {min:fmt(new Date(d.getFullYear(),d.getMonth(),1)),max:t}; }
  if (preset==='lastmonth') { return {min:fmt(new Date(d.getFullYear(),d.getMonth()-1,1)),max:fmt(new Date(d.getFullYear(),d.getMonth(),0))}; }
  if (preset==='thisquarter') { const q=Math.floor(d.getMonth()/3); return {min:fmt(new Date(d.getFullYear(),q*3,1)),max:t}; }
  if (preset==='lastquarter') { const q=Math.floor(d.getMonth()/3); return {min:fmt(new Date(d.getFullYear(),q*3-3,1)),max:fmt(new Date(d.getFullYear(),q*3,0))}; }
  if (preset==='thisyear') { return {min:fmt(new Date(d.getFullYear(),0,1)),max:t}; }
  return {min:'',max:''};
};

const fmtThai = (s) => {
  if (!s) return '';
  const d=new Date(s); if(isNaN(d)) return s;
  const m=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return d.getDate()+' '+m[d.getMonth()]+' '+(d.getFullYear()+543).toString().slice(-2);
};

const getLabel = (r) => {
  if(r.type==='last6months') return '6 เดือนล่าสุด';
  if(r.type==='thismonth') return 'เดือนนี้';
  if(r.type==='lastmonth') return 'เดือนที่แล้ว';
  if(r.type==='thisquarter') return 'ไตรมาสนี้';
  if(r.type==='lastquarter') return 'ไตรมาสที่แล้ว';
  if(r.type==='thisyear') return 'ปีนี้';
  if(r.type==='today') return 'วันนี้';
  if(r.type==='all') return 'ทั้งหมด (ไม่กรอง)';
  if(r.type==='custom') { if(r.min&&r.max) return fmtThai(r.min)+' - '+fmtThai(r.max); if(r.min) return 'ตั้งแต่ '+fmtThai(r.min); if(r.max) return 'ถึง '+fmtThai(r.max); return 'กำหนดเอง'; }
  return 'เลือกช่วงเวลา';
};

const Tip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return React.createElement('div',{style:{background:'rgba(2,52,54,0.95)',borderRadius:12,padding:'10px 16px',boxShadow:'0 8px 24px rgba(0,0,0,0.25)'}},
    React.createElement('p',{style:{color:'#9CEAEF',fontSize:12,margin:'0 0 6px',fontFamily:RG.fontHeading}},label),
    payload.map((p,i)=>React.createElement('p',{key:i,style:{color:'#fff',fontSize:13,margin:'2px 0'}},
      React.createElement('span',{style:{display:'inline-block',width:10,height:10,borderRadius:'50%',background:p.color,marginRight:6}}),
      p.name+': ',React.createElement('strong',null,p.value)
    ))
  );
};

export default function Dashboard({ leads, followups, currentUser }) {
  const [dr, setDr] = useState({...getPresetRange('last6months'),type:'last6months'});
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);
  const [filterSellers, setFilterSellers] = useState([]);
  const [sellerOpen, setSellerOpen] = useState(false);
  const sellerList = [...new Set(leads.map(l=>l.owner).filter(Boolean))];

  const isAdmin = currentUser?.role==='admin'||currentUser?.role_is_system;
  const canViewAll = isAdmin||currentUser?.permissions?.dashboard?.view==='all';
  const canViewSelect = isAdmin||currentUser?.permissions?.dashboard?.view_select;
  const canExportAll = isAdmin||currentUser?.permissions?.dashboard?.export==='all';
  const canExport = canExportAll||currentUser?.permissions?.dashboard?.export==='own';

  const roleLeads = (canViewAll||(canViewSelect&&filterSellers.length>0))?leads:leads.filter(l=>l.owner===currentUser?.username);
  const displayLeads = filterSellers.length===0?roleLeads:roleLeads.filter(l=>filterSellers.includes(l.owner));

  const chkYear = (a,b)=>{
    if(a&&b){ const diff=Math.ceil(Math.abs(new Date(b)-new Date(a))/(864e5)); if(diff>365){toast.error('ระยะเวลาเกิน 1 ปี');return false;} } return true;
  };

  const data = useMemo(()=>{
    const fl = displayLeads.filter(l=>{
      if(dr.type==='all'||(!dr.min&&!dr.max)) return true;
      if(dr.min&&(!l.latestContactDate||l.latestContactDate<dr.min)) return false;
      if(dr.max&&(!l.latestContactDate||l.latestContactDate>dr.max)) return false;
      return true;
    });
    const td=today();
    const s=fl.reduce((a,l)=>{
      if(l.latestStatus===STATUS_ENUM.CLOSED) a.closed++;
      if(l.nextFollowupDate&&l.nextFollowupDate<=td) a.need++;
      if(l.latestStatus) a.sc[l.latestStatus]=(a.sc[l.latestStatus]||0)+1;
      return a;
    },{closed:0,need:0,sc:{}});

    const pie=STATUSES.map(n=>({name:n,value:s.sc[n]||0})).filter(x=>x.value>0);

    let months=[];
    if(dr.type==='all'||(!dr.min&&!dr.max)){
      months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return{key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),label:d.toLocaleDateString('th-TH',{month:'short',year:'2-digit'})};});
    } else {
      let sd=dr.min?new Date(dr.min):new Date(new Date().setMonth(new Date().getMonth()-5));
      let ed=dr.max?new Date(dr.max):new Date();
      if(sd>ed){const t=sd;sd=ed;ed=t;}
      let cd=new Date(sd.getFullYear(),sd.getMonth(),1);
      const ld=new Date(ed.getFullYear(),ed.getMonth(),1);
      while(cd<=ld){months.push({key:cd.getFullYear()+'-'+String(cd.getMonth()+1).padStart(2,'0'),label:cd.toLocaleDateString('th-TH',{month:'short',year:'2-digit'})});cd.setMonth(cd.getMonth()+1);}
    }
    const keys=new Set(months.map(m=>m.key));
    const lbm=displayLeads.reduce((a,l)=>{if(!l.latestContactDate)return a;const k=l.latestContactDate.slice(0,7);if(!keys.has(k))return a;a[k]=a[k]||{t:0,c:0};a[k].t++;if(l.latestStatus===STATUS_ENUM.CLOSED)a[k].c++;return a;},{});
    const fbm=Object.values(followups).flat().reduce((a,f)=>{if(!f.date)return a;const k=f.date.slice(0,7);if(keys.has(k))a[k]=(a[k]||0)+1;return a;},{});
    const line=months.map(m=>({name:m.label,ติดตาม:fbm[m.key]||0,ปิดการขาย:lbm[m.key]?.c||0}));
    const bar=months.map(m=>({name:m.label,โทร:lbm[m.key]?.t||0,ปิด:lbm[m.key]?.c||0}));
    const hasData=line.some(d=>d.ติดตาม>0||d.ปิดการขาย>0)||bar.some(d=>d.โทร>0||d.ปิด>0);
    return{total:fl.length,need:s.need,pie,line,bar,hasData,sc:s.sc};
  },[displayLeads,followups,dr]);

  const {total,need,pie,line,bar,hasData,sc}=data;

  const kpis=[
    {label:'ลีดทั้งหมด',value:total,icon:'👥',g:'linear-gradient(135deg,#667eea,#764ba2)',sh:'rgba(102,126,234,0.35)'},
    {label:'ต้องติดตามวันนี้',value:need,icon:'🔔',g:'linear-gradient(135deg,#f093fb,#f5576c)',sh:'rgba(245,87,108,0.35)'},
    {label:'ปิดการขาย',value:sc[STATUS_ENUM.CLOSED]||0,icon:'✅',g:'linear-gradient(135deg,#11998e,#38ef7d)',sh:'rgba(56,239,125,0.30)'},
    {label:'มีตติ้ง',value:sc[STATUS_ENUM.MEETING]||0,icon:'📅',g:'linear-gradient(135deg,#ffd89b,#19547b)',sh:'rgba(25,84,123,0.35)'},
    {label:'ต้องตามต่อ',value:sc[STATUS_ENUM.FOLLOW_UP]||0,icon:'📞',g:'linear-gradient(135deg,#fc466b,#3f5efb)',sh:'rgba(63,94,251,0.30)'},
    {label:'ฝากโปรไฟล์',value:sc[STATUS_ENUM.PROFILE]||0,icon:'📝',g:'linear-gradient(135deg,#89f7fe,#66a6ff)',sh:'rgba(102,166,255,0.30)'},
    {label:'ติดต่อไม่ได้',value:sc[STATUS_ENUM.UNREACHABLE]||0,icon:'📵',g:'linear-gradient(135deg,#868f96,#596164)',sh:'rgba(89,97,100,0.30)'},
    {label:'ไม่สนใจ',value:sc[STATUS_ENUM.NOT_INTERESTED]||0,icon:'❌',g:'linear-gradient(135deg,#ee9ca7,#ffdde1)',sh:'rgba(238,156,167,0.30)',tc:'#7f1d1d'},
  ];

  const doExport = async (e) => {
    const val=e.target.value; e.target.value=''; if(!val) return;
    const [mode,fmt]=val.split('_');
    let prev=filterSellers;
    if(mode==='all'&&canExportAll){setFilterSellers([]);await new Promise(r=>setTimeout(r,800));}
    if(!exportRef.current||isExporting) return;
    setIsExporting(true); await new Promise(r=>setTimeout(r,200));
    try {
      const fn='dashboard-'+(dr.min||'all')+'-'+new Date().toISOString().slice(0,10);
      if(fmt==='png'){const u=await toPng(exportRef.current,{quality:1,backgroundColor:'#fff',pixelRatio:2});const a=document.createElement('a');a.href=u;a.download=fn+'.png';a.click();}
      else if(fmt==='pdf'){
        const u=await toJpeg(exportRef.current,{quality:0.8,backgroundColor:'#fff',pixelRatio:1.5});
        const pdf=new jsPDF('p','mm','a4');const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
        const ip=pdf.getImageProperties(u);const ratio=ip.width/ip.height;
        let fw=pw,fh=fw/ratio; if(fh>ph){fh=ph;fw=fh*ratio;}
        pdf.addImage(u,'PNG',(pw-fw)/2,(ph-fh)/2,fw,fh); pdf.save(fn+'.pdf');
      }
    } catch(err){toast.error('ไม่สามารถส่งออกได้');}
    finally{setIsExporting(false);if(mode==='all'&&currentUser?.permissions?.dashboard?.export==='all')setFilterSellers(prev);}
  };

  const crd = (ex) => ({background:RG.surface,borderRadius:20,padding:28,boxShadow:'0 2px 16px rgba(3,181,170,0.08)',border:'1px solid '+RG.border});
  const nowStr=new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  return React.createElement(React.Fragment,null,
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,flexWrap:'wrap',gap:12}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}},
        React.createElement('button',{onClick:()=>setShowModal(true),style:{display:'flex',alignItems:'center',gap:8,padding:'9px 20px',borderRadius:50,border:'1.5px solid '+RG.primary,background:'#fff',color:RG.primary,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:RG.fontHeading,boxShadow:'0 2px 8px rgba(3,181,170,0.15)',whiteSpace:'nowrap'}},
          React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2.5'},
            React.createElement('rect',{x:3,y:4,width:18,height:18,rx:2}),
            React.createElement('line',{x1:16,y1:2,x2:16,y2:6}),React.createElement('line',{x1:8,y1:2,x2:8,y2:6}),React.createElement('line',{x1:3,y1:10,x2:21,y2:10})
          ),
          getLabel(dr)
        ),
        React.createElement('span',{style:{fontSize:12,color:RG.textMuted,fontFamily:RG.fontBody}},nowStr)
      ),
      React.createElement('div',{style:{display:'flex',gap:10,alignItems:'center'}},
        (canViewAll||canViewSelect)&&React.createElement('div',{style:{position:'relative'}},
          React.createElement('div',{onClick:()=>setSellerOpen(!sellerOpen),style:{...inputStyle,width:'180px',cursor:'pointer',backgroundColor:filterSellers.length>0?'#fffbeb':'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',border:filterSellers.length>0?'1px solid #fcd34d':'1px solid '+RG.border,borderRadius:50,paddingLeft:14,paddingRight:10}},
            React.createElement('span',{style:{color:filterSellers.length>0?'#b45309':RG.text,fontSize:13,fontFamily:RG.fontHeading}},filterSellers.length===0?'👥 ทุกเซลส์':'👥 '+filterSellers.length+' เซลส์'),
            React.createElement('span',{style:{fontSize:10}},'▼')
          ),
          sellerOpen&&React.createElement('div',{style:{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid '+RG.border,borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:50,padding:'8px 0',marginTop:8,maxHeight:250,overflowY:'auto'}},
            React.createElement('label',{style:{display:'flex',alignItems:'center',padding:'8px 16px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #eee'}},
              React.createElement('input',{type:'checkbox',checked:filterSellers.length===0,onChange:()=>setFilterSellers([]),style:{marginRight:8}}),'แสดงทุกเซลส์'
            ),
            sellerList.map(s=>React.createElement('label',{key:s,style:{display:'flex',alignItems:'center',padding:'8px 16px',cursor:'pointer',fontSize:13}},
              React.createElement('input',{type:'checkbox',checked:filterSellers.includes(s),onChange:()=>setFilterSellers(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]),style:{marginRight:8}}),s
            ))
          )
        ),
        canExport&&React.createElement('select',{onChange:doExport,disabled:isExporting,value:'',style:{padding:'0 18px',borderRadius:50,border:'1.5px solid '+RG.primary,backgroundColor:RG.primary,color:'#fff',cursor:isExporting?'not-allowed':'pointer',fontSize:13,fontWeight:600,height:38,outline:'none',fontFamily:RG.fontHeading,boxShadow:'0 2px 8px rgba(3,181,170,0.3)'}},
          React.createElement('option',{value:'',disabled:true},isExporting?'กำลังเซฟ...':'⬇ Export'),
          React.createElement('optgroup',{label:'เฉพาะหน้าปัจจุบัน'},React.createElement('option',{value:'current_png'},'PNG Image'),React.createElement('option',{value:'current_pdf'},'PDF (Print)')),
          canExportAll&&React.createElement('optgroup',{label:'ทั้งหมด'},React.createElement('option',{value:'all_png'},'PNG Image'),React.createElement('option',{value:'all_pdf'},'PDF (Print All)'))
        )
      )
    ),

    React.createElement('div',{ref:exportRef,style:{padding:isExporting?'40px 15px':'4px',background:isExporting?'#fff':'transparent',fontFamily:isExporting?'Sarabun,sans-serif':'inherit',width:isExporting?'1100px':'100%',boxSizing:'border-box',margin:0}},

      isExporting&&React.createElement('div',{style:{marginBottom:40,paddingBottom:24,borderBottom:'2px solid '+RG.border,display:'flex',justifyContent:'space-between',alignItems:'flex-end'}},
        React.createElement('div',null,React.createElement('div',{style:{fontSize:28,fontWeight:700,color:RG.text,marginBottom:8}},'รายงานสรุปภาพรวมการขาย'),React.createElement('div',{style:{fontSize:16,color:RG.textMuted}},'ช่วงเวลา: ',React.createElement('span',{style:{fontWeight:600,color:RG.primaryMid}},getLabel(dr)))),
        React.createElement('div',{style:{textAlign:'right'}},React.createElement('div',{style:{fontSize:20,fontWeight:700,color:RG.primaryMid}},'Sales_CRM'),React.createElement('div',{style:{fontSize:12,color:RG.textMuted,marginTop:8}},'ข้อมูล ณ '+new Date().toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'numeric'})+' เวลา '+new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})))
      ),

      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(8, 1fr)',gap:12,marginBottom:32}},
        kpis.map(k=>React.createElement('div',{key:k.label,
          style:{background:k.g,borderRadius:12,padding:'12px 10px 10px',boxShadow:'0 4px 12px '+(k.sh||'rgba(0,0,0,0.15)'),position:'relative',overflow:'hidden',transition:'transform 0.25s,box-shadow 0.25s',cursor:'pointer',border:'none'},
          onMouseOver:(e)=>{if(!isExporting){e.currentTarget.style.transform='translateY(-4px) scale(1.02)';e.currentTarget.style.boxShadow='0 12px 24px '+(k.sh||'rgba(0,0,0,0.2)');}},
          onMouseOut:(e)=>{if(!isExporting){e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 12px '+(k.sh||'rgba(0,0,0,0.15)');}},
        },
          React.createElement('div',{style:{position:'absolute',top:-10,right:-10,width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.13)'}}),
          React.createElement('div',{style:{position:'absolute',bottom:-15,right:5,width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.09)'}}),
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'relative'}},
            React.createElement('div',null,
              React.createElement('div',{style:{fontSize:10,fontFamily:RG.fontHeading,fontWeight:600,color:(k.tc||'rgba(255,255,255,0.85)'),marginBottom:4}},k.label),
              React.createElement('div',{style:{fontSize:24,fontWeight:800,fontFamily:RG.fontHeading,color:(k.tc||'#fff'),lineHeight:1}},k.value)
            ),
            React.createElement('div',{style:{fontSize:18,opacity:0.9,lineHeight:1}},k.icon)
          )
        ))
      ),

      React.createElement('div',{style:{display:'grid',gridTemplateColumns:isExporting?'1fr':'380px 1fr',gap:24,marginBottom:24}},

        React.createElement('div',{style:crd(isExporting)},
          React.createElement('h4',{style:{margin:'0 0 20px',color:RG.text,fontSize:16,fontWeight:700,fontFamily:RG.fontHeading}},'สัดส่วนสถานะลีด'),
          pie.length===0
            ?React.createElement('div',{style:{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:200,color:RG.textMuted,fontSize:13,gap:10}},React.createElement('span',{style:{fontSize:48}},'📭'),'ไม่มีข้อมูลในช่วงเวลานี้')
            :React.createElement(React.Fragment,null,
              React.createElement(ResponsiveContainer,{width:'100%',height:220},
                React.createElement(PieChart,null,
                  React.createElement(Pie,{data:pie,cx:'50%',cy:'50%',innerRadius:isExporting?58:72,outerRadius:isExporting?92:106,paddingAngle:3,dataKey:'value',isAnimationActive:!isExporting},
                    pie.map(e=>React.createElement(Cell,{key:e.name,fill:STATUS_COLORS[e.name]||'#ccc',stroke:'none'}))
                  ),
                  React.createElement(Tooltip,{content:({active,payload})=>{
                    if(active&&payload?.length){const d=payload[0];const pct=Math.round((d.value/total)*100);return React.createElement('div',{style:{background:'rgba(2,52,54,0.95)',borderRadius:10,padding:'10px 16px'}},React.createElement('p',{style:{color:'#9CEAEF',fontSize:12,margin:'0 0 4px',fontFamily:RG.fontHeading}},d.name),React.createElement('p',{style:{color:'#fff',fontSize:16,fontWeight:700,margin:0}},d.value+' ลีด ('+pct+'%)'));}return null;
                  }}),
                  React.createElement('text',{x:'50%',y:'43%',textAnchor:'middle',dominantBaseline:'middle',style:{fontSize:32,fontWeight:800,fill:RG.text,fontFamily:RG.fontHeading}},total),
                  React.createElement('text',{x:'50%',y:'57%',textAnchor:'middle',dominantBaseline:'middle',style:{fontSize:11,fill:RG.textMuted,fontFamily:RG.fontBody}},'ลีดทั้งหมด')
                )
              ),
              React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px',marginTop:8}},
                pie.map(e=>React.createElement('div',{key:e.name,style:{display:'flex',alignItems:'center',gap:8}},
                  React.createElement('div',{style:{width:10,height:10,borderRadius:'50%',background:STATUS_COLORS[e.name]||'#ccc',flexShrink:0}}),
                  React.createElement('span',{style:{fontSize:12,color:RG.textMuted,fontFamily:RG.fontBody,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},e.name),
                  React.createElement('span',{style:{fontSize:12,fontWeight:700,color:RG.text,fontFamily:RG.fontHeading}},e.value)
                ))
              )
            )
        ),

        React.createElement('div',{style:crd(isExporting)},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}},
            React.createElement('h4',{style:{margin:0,color:RG.text,fontSize:16,fontWeight:700,fontFamily:RG.fontHeading}},'แนวโน้มการติดตาม'),
            React.createElement('div',{style:{display:'flex',gap:16}},
              [{label:'ติดตาม',color:RG.primary},{label:'ปิดการขาย',color:RG.success}].map(l=>React.createElement('span',{key:l.label,style:{display:'flex',alignItems:'center',gap:6,fontSize:12,color:RG.textMuted,fontFamily:RG.fontBody}},React.createElement('span',{style:{width:20,height:3,borderRadius:2,background:l.color,display:'inline-block'}}),l.label))
            )
          ),
          !hasData
            ?React.createElement('div',{style:{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:240,color:RG.textMuted,fontSize:13,gap:10}},React.createElement('span',{style:{fontSize:48}},'📊'),'ไม่มีข้อมูลในช่วงเวลานี้')
            :React.createElement(ResponsiveContainer,{width:'100%',height:isExporting?250:280},
              React.createElement(AreaChart,{data:line,margin:{top:5,right:10,left:-20,bottom:0}},
                React.createElement('defs',null,
                  React.createElement('linearGradient',{id:'gT',x1:0,y1:0,x2:0,y2:1},React.createElement('stop',{offset:'5%',stopColor:RG.primary,stopOpacity:0.3}),React.createElement('stop',{offset:'95%',stopColor:RG.primary,stopOpacity:0})),
                  React.createElement('linearGradient',{id:'gP',x1:0,y1:0,x2:0,y2:1},React.createElement('stop',{offset:'5%',stopColor:RG.success,stopOpacity:0.3}),React.createElement('stop',{offset:'95%',stopColor:RG.success,stopOpacity:0}))
                ),
                React.createElement(CartesianGrid,{strokeDasharray:'3 3',stroke:'rgba(3,181,170,0.1)'}),
                React.createElement(XAxis,{dataKey:'name',tick:{fontSize:12,fill:RG.textMuted},axisLine:false,tickLine:false}),
                React.createElement(YAxis,{tick:{fontSize:12,fill:RG.textMuted},axisLine:false,tickLine:false}),
                React.createElement(Tooltip,{content:React.createElement(Tip,null)}),
                React.createElement(Area,{type:'monotone',dataKey:'ติดตาม',stroke:RG.primary,strokeWidth:2.5,fill:'url(#gT)',dot:{r:5,fill:RG.primary,strokeWidth:2,stroke:'#fff'},activeDot:{r:7},isAnimationActive:!isExporting}),
                React.createElement(Area,{type:'monotone',dataKey:'ปิดการขาย',stroke:RG.success,strokeWidth:2.5,fill:'url(#gP)',dot:{r:5,fill:RG.success,strokeWidth:2,stroke:'#fff'},activeDot:{r:7},isAnimationActive:!isExporting})
              )
            )
        )
      ),

      React.createElement('div',{style:crd(isExporting)},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}},
          React.createElement('h4',{style:{margin:0,color:RG.text,fontSize:16,fontWeight:700,fontFamily:RG.fontHeading}},'Monthly Conversion'),
          React.createElement('div',{style:{display:'flex',gap:16}},
            [{label:'โทร',color:RG.primary},{label:'ปิด',color:RG.success}].map(l=>React.createElement('span',{key:l.label,style:{display:'flex',alignItems:'center',gap:6,fontSize:12,color:RG.textMuted}},React.createElement('span',{style:{width:12,height:12,borderRadius:3,background:l.color,display:'inline-block'}}),l.label))
          )
        ),
        !hasData
          ?React.createElement('div',{style:{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:160,color:RG.textMuted,fontSize:13,gap:10}},React.createElement('span',{style:{fontSize:48}},'📈'),'ไม่มีข้อมูลในช่วงเวลานี้')
          :React.createElement(ResponsiveContainer,{width:'100%',height:isExporting?270:200},
            React.createElement(BarChart,{data:bar,margin:{top:5,right:10,left:-20,bottom:0}},
              React.createElement(CartesianGrid,{strokeDasharray:'3 3',stroke:'rgba(3,181,170,0.1)',vertical:false}),
              React.createElement(XAxis,{dataKey:'name',tick:{fontSize:12,fill:RG.textMuted},axisLine:false,tickLine:false}),
              React.createElement(YAxis,{tick:{fontSize:12,fill:RG.textMuted},axisLine:false,tickLine:false}),
              React.createElement(Tooltip,{content:React.createElement(Tip,null),cursor:{fill:'rgba(3,181,170,0.05)'}}),
              React.createElement(Bar,{dataKey:'โทร',fill:RG.primary,radius:[6,6,0,0],maxBarSize:52,isAnimationActive:!isExporting}),
              React.createElement(Bar,{dataKey:'ปิด',fill:RG.success,radius:[6,6,0,0],maxBarSize:52,isAnimationActive:!isExporting})
            )
          )
      ),

      isExporting&&React.createElement('div',{style:{marginTop:50,borderTop:'2px solid #e2e8f0',paddingTop:20,display:'flex',justifyContent:'space-between',color:'#64748b',fontSize:13}},
        React.createElement('div',null,'© 2026 Sales_CRM System. All rights reserved.'),
        React.createElement('div',null,'รายงานสำหรับใช้ภายในองค์กรเท่านั้น (Internal Use Only)')
      )
    ),

    showModal&&React.createElement(Modal,{title:'กรองข้อมูลตามช่วงเวลา',onClose:()=>setShowModal(false),width:450},
      React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:16}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12}},
          React.createElement('div',{style:{width:120,fontSize:13,color:RG.textMuted}},'ติดต่อล่าสุด:'),
          React.createElement('select',{value:dr.type||'all',onChange:(e)=>setDr({...getPresetRange(e.target.value),type:e.target.value}),style:{...inputStyle,flex:1}},
            React.createElement('option',{value:'today'},'วันนี้'),
            React.createElement('option',{value:'thismonth'},'เดือนนี้'),
            React.createElement('option',{value:'lastmonth'},'เดือนที่แล้ว'),
            React.createElement('option',{value:'thisquarter'},'ไตรมาสนี้'),
            React.createElement('option',{value:'lastquarter'},'ไตรมาสที่แล้ว'),
            React.createElement('option',{value:'last6months'},'6 เดือนล่าสุด (ค่าเริ่มต้น)'),
            React.createElement('option',{value:'thisyear'},'ปีนี้'),
            React.createElement('option',{value:'all'},'ทั้งหมด (ไม่กรอง)'),
            React.createElement('option',{value:'custom'},'กำหนดช่วงเวลาแทน (สูงสุด 1 ปี)')
          )
        ),
        dr.type==='custom'&&React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12,paddingLeft:132}},
          React.createElement('input',{type:'date',value:dr.min||'',onChange:e=>{const next={...dr,min:e.target.value,type:'custom'};if(chkYear(next.min,next.max))setDr(next);},style:{...inputStyle,flex:1}}),
          React.createElement('span',{style:{color:RG.textMuted}},'-'),
          React.createElement('input',{type:'date',value:dr.max||'',onChange:e=>{const next={...dr,max:e.target.value,type:'custom'};if(chkYear(next.min,next.max))setDr(next);},style:{...inputStyle,flex:1}})
        ),
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',marginTop:12}},
          React.createElement('button',{onClick:()=>setDr({...getPresetRange('last6months'),type:'last6months'}),style:{padding:'8px 16px',borderRadius:8,border:'1px solid '+RG.border,background:'#f5e6ea',color:RG.primary,cursor:'pointer',fontWeight:600,fontSize:13}},'กลับเป็นค่าเริ่มต้น'),
          React.createElement('button',{onClick:()=>setShowModal(false),style:{padding:'8px 24px',borderRadius:8,border:'none',background:RG.gradient,color:'#fff',cursor:'pointer',fontWeight:600,fontSize:13}},'ตกลง')
        )
      )
    )
  );
}