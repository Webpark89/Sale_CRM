import React, { useState, useRef, useMemo } from "react";
import notify from "../../../utils/toast";

import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { STAGES, STAGE_COLORS, STAGE_STATUS_MAP } from "../constants/status";
import { RG } from "../constants/theme";
import { today, PROVINCES } from "../crmHelpers/helpers";
import { toJpeg, toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { inputStyle } from "../components/common/styles";
import Modal from "../components/common/Modal";
import { MapPin, UsersRound, Bell, CircleDollarSign, AlertTriangle, CheckCircle, FileText, Calendar, Phone } from "lucide-react";

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
    payload.map((p,i)=>React.createElement('p',{key:i,style:{color:RG.surface,fontSize:13,margin:'2px 0'}},
      React.createElement('span',{style:{display:'inline-block',width:10,height:10,borderRadius:'50%',background:p.color,marginRight:6}}),
      p.name+': ',React.createElement('strong',null,p.value)
    ))
  );
};

export default function Dashboard({ leads, followups, currentUser, onSelectLead }) {
  const [dr, setDr] = useState({...getPresetRange('last6months'),type:'last6months'});
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);
  const [filterSellers, setFilterSellers] = useState([]);
  const [sellerOpen, setSellerOpen] = useState(false);
  const sellerList = [...new Set(leads.map(l=>l.owner).filter(Boolean))];

  const [filterProvince, setFilterProvince] = useState([]);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const provinceList = PROVINCES;

  const isAdmin = currentUser?.role==='admin'||currentUser?.role_is_system;
  const canViewAll = isAdmin||currentUser?.permissions?.dashboard?.view==='all';
  const canViewSelect = isAdmin||currentUser?.permissions?.dashboard?.view_select;
  const canExportAll = isAdmin||currentUser?.permissions?.dashboard?.export==='all';
  const canExport = canExportAll||currentUser?.permissions?.dashboard?.export==='own';

  const roleLeads = (canViewAll||(canViewSelect&&filterSellers.length>0))?leads:leads.filter(l=>l.owner===currentUser?.username);
  let displayLeads = filterSellers.length===0?roleLeads:roleLeads.filter(l=>filterSellers.includes(l.owner));
  if (filterProvince.length > 0) {
    displayLeads = displayLeads.filter(l => filterProvince.includes(l.province));
  }

  const chkYear = (a,b)=>{
    if(a&&b){ const diff=Math.ceil(Math.abs(new Date(b)-new Date(a))/(864e5)); if(diff>365){notify.error('ระยะเวลาเกิน 1 ปี');return false;} } return true;
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
      if(l.stage==='Closed') {
        a.closed++;
        if(l.latestStatus==='Won'){a.won++; a.wonRev+=(Number(l.dealValue)||0);}
        else if(l.latestStatus==='Lost'){a.lost++;}
      } else {
        if(l.dealValue) a.activeRev+=(Number(l.dealValue)||0);
        if(l.latestContactDate){
          const diff=(new Date()-new Date(l.latestContactDate))/864e5;
          if(diff>14) a.stale++;
        }
      }
      if(l.nextFollowupDate&&l.nextFollowupDate<=td&&l.stage!=='Closed') a.need++;
      if(l.stage) a.sc[l.stage]=(a.sc[l.stage]||0)+1;
      return a;
    },{closed:0,won:0,lost:0,wonRev:0,activeRev:0,stale:0,need:0,sc:{}});

    const pie=STAGES.map(n=>({name:n,value:s.sc[n]||0})).filter(x=>x.value>0);
    const funnel=STAGES.filter(n=>n!=='Closed').map(n=>({name:n,value:s.sc[n]||0,fill:STAGE_COLORS[n]}));
    const winLoss=[{name:'Won',value:s.won,fill:RG.success||'#10b981'},{name:'Lost',value:s.lost,fill:'#ef4444'}];

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
    const lbm=displayLeads.reduce((a,l)=>{if(!l.latestContactDate)return a;const k=l.latestContactDate.slice(0,7);if(!keys.has(k))return a;a[k]=a[k]||{t:0,c:0};a[k].t++;if(l.stage==='Closed')a[k].c++;return a;},{});
    const fbm=Object.values(followups).flat().reduce((a,f)=>{if(!f.date)return a;const k=f.date.slice(0,7);if(keys.has(k))a[k]=(a[k]||0)+1;return a;},{});
    const line=months.map(m=>({name:m.label,ติดตาม:fbm[m.key]||0,Closed:lbm[m.key]?.c||0}));
    const bar=months.map(m=>({name:m.label,ลีด:lbm[m.key]?.t||0,ปิด:lbm[m.key]?.c||0}));
    const hasData=line.some(d=>d.ติดตาม>0||d.Closed>0)||bar.some(d=>d.ลีด>0||d.ปิด>0);
    return{total:fl.length,need:s.need,pie,line,bar,hasData,sc:s.sc,funnel,winLoss,activeRev:s.activeRev,stale:s.stale,won:s.won,lost:s.lost};
  },[displayLeads,followups,dr]);

  const {total,need,pie,line,bar,hasData,sc,funnel,winLoss,activeRev,stale}=data;

  const hotDeals = useMemo(() => {
    return displayLeads
      .filter(l => l.stage !== 'Closed' && Number(l.dealValue || 0) > 0)
      .sort((a, b) => Number(b.dealValue || 0) - Number(a.dealValue || 0))
      .slice(0, 5);
  }, [displayLeads]);

  const kpis=[
    {label:'ลีดทั้งหมด',value:total,icon:UsersRound,c:RG.primary},
    {label:'ต้องติดตามวันนี้',value:need,icon:Bell,c:'#C62828'},
    {label:'ยอดเงิน Pipeline',value:activeRev>=1000000?(activeRev/1000000).toFixed(1)+'M':activeRev>=1000?(activeRev/1000).toFixed(1)+'k':activeRev,icon:CircleDollarSign,c:'#F59E0B'},
    {label:'Stale (>14วัน)',value:stale,icon:AlertTriangle,c:'#ef4444'},
    {label:'Approval',value:sc['Approval']||0,icon:CheckCircle,c:STAGE_COLORS['Approval']},
    {label:'Proposal',value:sc['Proposal']||0,icon:FileText,c:STAGE_COLORS['Proposal']},
    {label:'Meeting',value:sc['Meeting']||0,icon:Calendar,c:STAGE_COLORS['Meeting']},
    {label:'Contact',value:sc['Contact']||0,icon:Phone,c:STAGE_COLORS['Contact']},
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
      if(fmt==='png'){const u=await toPng(exportRef.current,{quality:1,backgroundColor:RG.surface,pixelRatio:2});const a=document.createElement('a');a.href=u;a.download=fn+'.png';a.click();}
      else if(fmt==='pdf'){
        const u=await toJpeg(exportRef.current,{quality:0.8,backgroundColor:RG.surface,pixelRatio:1.5});
        const pdf=new jsPDF('p','mm','a4');const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
        const ip=pdf.getImageProperties(u);const ratio=ip.width/ip.height;
        let fw=pw,fh=fw/ratio; if(fh>ph){fh=ph;fw=fh*ratio;}
        pdf.addImage(u,'PNG',(pw-fw)/2,(ph-fh)/2,fw,fh); pdf.save(fn+'.pdf');
      }
    } catch(err){notify.error('ไม่สามารถส่งออกได้');}
    finally{setIsExporting(false);if(mode==='all'&&currentUser?.permissions?.dashboard?.export==='all')setFilterSellers(prev);}
  };

  const crd = (ex) => ({background:RG.surface,borderRadius:12,padding:20,boxShadow:RG.shadowSoft,border:'1px solid '+RG.border});
  const nowStr=new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  return React.createElement(React.Fragment,null,
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,flexWrap:'wrap',gap:12}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}},
        React.createElement('button',{onClick:()=>setShowModal(true),style:{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:8,border:'1px solid '+RG.border,background:RG.surface,color:RG.text,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:RG.fontHeading,boxShadow:RG.shadowSoft,whiteSpace:'nowrap'}},
          React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2.5'},
            React.createElement('rect',{x:3,y:4,width:18,height:18,rx:2}),
            React.createElement('line',{x1:16,y1:2,x2:16,y2:6}),React.createElement('line',{x1:8,y1:2,x2:8,y2:6}),React.createElement('line',{x1:3,y1:10,x2:21,y2:10})
          ),
          getLabel(dr)
        ),
        React.createElement('span',{style:{fontSize:12,color:RG.textMuted,fontFamily:RG.fontBody}},nowStr)
      ),
      React.createElement('div',{style:{display:'flex',gap:10,alignItems:'center'}},
        React.createElement('div',{style:{position:'relative'}},
          React.createElement('div',{onClick:()=>setProvinceOpen(!provinceOpen),style:{...inputStyle,width:'180px',cursor:'pointer',backgroundColor:filterProvince.length>0?'#EFF6FF':RG.surface,display:'flex',justifyContent:'space-between',alignItems:'center',border:filterProvince.length>0?`1px solid ${RG.primaryLight}`:'1px solid '+RG.border,borderRadius:8,paddingLeft:14,paddingRight:10}},
            React.createElement('span',{style:{color:filterProvince.length>0?RG.primaryMid:RG.text,fontSize:13,fontFamily:RG.fontHeading,display:'flex',alignItems:'center',gap:6}},
              React.createElement(MapPin,{size:14}),
              filterProvince.length===0?'แสดงทุกจังหวัด':`เลือกแล้ว ${filterProvince.length} จังหวัด`
            ),
            React.createElement('span',{style:{fontSize:10}},'▼')
          ),
          provinceOpen&&React.createElement('div',{style:{position:'absolute',top:'100%',left:0,right:0,background:RG.surface,border:'1px solid '+RG.border,borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:50,padding:'8px 0',marginTop:8,maxHeight:250,overflowY:'auto'}},
            React.createElement('label',{style:{display:'flex',alignItems:'center',padding:'8px 16px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #eee'}},
              React.createElement('input',{type:'checkbox',checked:filterProvince.length===0,onChange:()=>setFilterProvince([]),style:{marginRight:8}}),'แสดงทุกจังหวัด'
            ),
            provinceList.map(p=>React.createElement('label',{key:p,style:{display:'flex',alignItems:'center',padding:'8px 16px',cursor:'pointer',fontSize:13}},
              React.createElement('input',{type:'checkbox',checked:filterProvince.includes(p),onChange:()=>setFilterProvince(arr=>arr.includes(p)?arr.filter(x=>x!==p):[...arr,p]),style:{marginRight:8}}),p
            ))
          )
        ),
        (canViewAll||canViewSelect)&&React.createElement('div',{style:{position:'relative'}},
          React.createElement('div',{onClick:()=>setSellerOpen(!sellerOpen),style:{...inputStyle,width:'180px',cursor:'pointer',backgroundColor:filterSellers.length>0?'#EFF6FF':RG.surface,display:'flex',justifyContent:'space-between',alignItems:'center',border:filterSellers.length>0?`1px solid ${RG.primaryLight}`:'1px solid '+RG.border,borderRadius:8,paddingLeft:14,paddingRight:10}},
            React.createElement('span',{style:{color:filterSellers.length>0?RG.primaryMid:RG.text,fontSize:13,fontFamily:RG.fontHeading,display:'flex',alignItems:'center',gap:6}},
              React.createElement(UsersRound,{size:14}),
              filterSellers.length===0?'แสดงทุกเซลส์':`เลือกแล้ว ${filterSellers.length} เซลส์`
            ),
            React.createElement('span',{style:{fontSize:10}},'▼')
          ),
          sellerOpen&&React.createElement('div',{style:{position:'absolute',top:'100%',left:0,right:0,background:RG.surface,border:'1px solid '+RG.border,borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:50,padding:'8px 0',marginTop:8,maxHeight:250,overflowY:'auto'}},
            React.createElement('label',{style:{display:'flex',alignItems:'center',padding:'8px 16px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #eee'}},
              React.createElement('input',{type:'checkbox',checked:filterSellers.length===0,onChange:()=>setFilterSellers([]),style:{marginRight:8}}),'แสดงทุกเซลส์'
            ),
            sellerList.map(s=>React.createElement('label',{key:s,style:{display:'flex',alignItems:'center',padding:'8px 16px',cursor:'pointer',fontSize:13}},
              React.createElement('input',{type:'checkbox',checked:filterSellers.includes(s),onChange:()=>setFilterSellers(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]),style:{marginRight:8}}),s
            ))
          )
        ),
        canExport&&React.createElement('select',{onChange:doExport,disabled:isExporting,value:'',style:{padding:'0 16px',borderRadius:8,border:'1px solid '+RG.primary,backgroundColor:RG.primary,color:RG.surface,cursor:isExporting?'not-allowed':'pointer',fontSize:13,fontWeight:600,height:38,outline:'none',fontFamily:RG.fontHeading,boxShadow:RG.shadowSoft}},
          React.createElement('option',{value:'',disabled:true,style:{backgroundColor:RG.surface,color:RG.text}},isExporting?'กำลังเซฟ...':'Export Reports'),
          React.createElement('optgroup',{label:'เฉพาะหน้าปัจจุบัน',style:{backgroundColor:RG.surface,color:RG.text}},React.createElement('option',{value:'current_png'},'PNG Image'),React.createElement('option',{value:'current_pdf'},'PDF (Print)')),
          canExportAll&&React.createElement('optgroup',{label:'ทั้งหมด',style:{backgroundColor:RG.surface,color:RG.text}},React.createElement('option',{value:'all_png'},'PNG Image'),React.createElement('option',{value:'all_pdf'},'PDF (Print All)'))
        )
      )
    ),

    React.createElement('div',{ref:exportRef,style:{padding:isExporting?'40px 15px':'4px',background:isExporting?RG.surface:'transparent',fontFamily:isExporting?'Sarabun,sans-serif':'inherit',width:isExporting?'1100px':'100%',boxSizing:'border-box',margin:0}},

      isExporting&&React.createElement('div',{style:{marginBottom:40,paddingBottom:24,borderBottom:'2px solid '+RG.border,display:'flex',justifyContent:'space-between',alignItems:'flex-end'}},
        React.createElement('div',null,React.createElement('div',{style:{fontSize:28,fontWeight:700,color:RG.text,marginBottom:8}},'รายงานสรุปภาพรวมการขาย'),React.createElement('div',{style:{fontSize:16,color:RG.textMuted}},'ช่วงเวลา: ',React.createElement('span',{style:{fontWeight:600,color:RG.primaryMid}},getLabel(dr)))),
        React.createElement('div',{style:{textAlign:'right'}},React.createElement('div',{style:{fontSize:20,fontWeight:700,color:RG.primaryMid}},'Sales_CRM'),React.createElement('div',{style:{fontSize:12,color:RG.textMuted,marginTop:8}},'ข้อมูล ณ '+new Date().toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'numeric'})+' เวลา '+new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})))
      ),

      
      React.createElement('div', { style: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' } },
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, flex: 1, minWidth: 400 } },
          kpis.slice(0, 4).map(k => React.createElement('div', { key: k.label,
            style: { background: RG.surface, borderRadius: 8, padding: '16px', boxShadow: RG.shadowSoft, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s,box-shadow 0.2s', cursor: 'pointer', border: '1px solid ' + RG.border, borderTop: `4px solid ${k.c}` },
            onMouseOver: (e) => { if (!isExporting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = RG.shadowGlow; } },
            onMouseOut: (e) => { if (!isExporting) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = RG.shadowSoft; } },
          },
            React.createElement('div', { style: { position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `${k.c}15` } }),
            React.createElement('div', { style: { position: 'absolute', bottom: -15, right: 5, width: 40, height: 40, borderRadius: '50%', background: `${k.c}10` } }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: 11, fontFamily: RG.fontHeading, fontWeight: 600, color: RG.textMuted, marginBottom: 4 } }, k.label),
                React.createElement('div', { style: { fontSize: 24, fontWeight: 800, fontFamily: RG.fontHeading, color: k.c, lineHeight: 1 } }, k.value)
              ),
              React.createElement('div', { style: { opacity: 0.9, color: k.c, display: 'flex', alignItems: 'center' } }, React.createElement(k.icon, { size: 24, strokeWidth: 1.5 }))
            )
          ))
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, flex: 1, minWidth: 400, background: '#f8fafc', padding: '18px 12px 12px 12px', borderRadius: 12, border: `1px solid ${RG.border}`, position: 'relative' } },
          React.createElement('div', { style: { position: 'absolute', top: -10, left: 16, background: RG.surface, padding: '0 8px', fontSize: 11, fontWeight: 700, color: RG.textMuted, border: `1px solid ${RG.border}`, borderRadius: 12 } }, 'Pipeline Stages'),
          kpis.slice(4).map(k => React.createElement('div', { key: k.label,
            style: { background: RG.surface, borderRadius: 8, padding: '12px', boxShadow: RG.shadowSoft, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s,box-shadow 0.2s', cursor: 'pointer', border: '1px solid ' + RG.border, borderTop: `4px solid ${k.c}` },
            onMouseOver: (e) => { if (!isExporting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = RG.shadowGlow; } },
            onMouseOut: (e) => { if (!isExporting) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = RG.shadowSoft; } },
          },
            React.createElement('div', { style: { position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `${k.c}15` } }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: 11, fontFamily: RG.fontHeading, fontWeight: 600, color: RG.textMuted, marginBottom: 2 } }, k.label),
                React.createElement('div', { style: { fontSize: 22, fontWeight: 800, fontFamily: RG.fontHeading, color: k.c, lineHeight: 1 } }, k.value)
              ),
              React.createElement('div', { style: { opacity: 0.9, color: k.c, display: 'flex', alignItems: 'center' } }, React.createElement(k.icon, { size: 20, strokeWidth: 1.5 }))
            )
          ))
        )
      ),



      React.createElement('div',{style:{display:'grid',gridTemplateColumns:isExporting?'1fr':'1fr 340px',gap:24,marginBottom:24}},
        React.createElement('div',{style:crd(isExporting)},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}},
            React.createElement('h4',{style:{margin:0,color:RG.text,fontSize:16,fontWeight:700,fontFamily:RG.fontHeading}},'Sales Pipeline Funnel')
          ),
          funnel.length===0
            ?React.createElement('div',{style:{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:240,color:RG.textMuted,fontSize:13,gap:10}},React.createElement('span',{style:{fontSize:48}},'📊'),'ไม่มีข้อมูลลีดในช่วงเวลานี้')
            :React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:20, paddingTop:10, paddingBottom:10}},
                funnel.map((f, i) => {
                  const maxV = Math.max(...funnel.map(x=>x.value), 1);
                  const w = Math.max((f.value / maxV) * 100, 1);
                  return React.createElement('div', {key:f.name, style:{position:'relative', marginBottom: 10}},
                    React.createElement('div', {style:{display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, fontWeight:700, color:RG.text, fontFamily:RG.fontHeading}}, 
                      React.createElement('span', null, f.name),
                      React.createElement('span', null, f.value + ' ลีด')
                    ),
                    React.createElement('div', {style:{width:'100%', background:'#f1f5f9', height:20, borderRadius:10, overflow:'hidden'}},
                      React.createElement('div', {style:{width:`${w}%`, height:'100%', background:f.fill, borderRadius:10, transition:'width 0.5s ease'}})
                    )
                  );
                })
              )
        ),
        React.createElement('div',{style:crd(isExporting)},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}},
            React.createElement('h4',{style:{margin:0,color:RG.text,fontSize:16,fontWeight:700,fontFamily:RG.fontHeading}},'Win / Loss Ratio')
          ),
          winLoss.length===0
            ?React.createElement('div',{style:{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:240,color:RG.textMuted,fontSize:13,gap:10}},React.createElement('span',{style:{fontSize:48}},'⚖️'),'ยังไม่มีลีดที่ปิดการขาย')
            :React.createElement(React.Fragment,null,
              React.createElement(ResponsiveContainer,{width:'100%',height:220},
                React.createElement(PieChart,null,
                  React.createElement(Pie,{data:winLoss,cx:'50%',cy:'50%',innerRadius:60,outerRadius:85,paddingAngle:5,dataKey:'value',isAnimationActive:!isExporting},
                    winLoss.map(e=>React.createElement(Cell,{key:e.name,fill:e.fill,stroke:'none'}))
                  ),
                  React.createElement(Tooltip,{content:({active,payload})=>{
                    if(active&&payload?.length){const d=payload[0];const wTotal=winLoss.reduce((s,i)=>s+i.value,0);const pct=Math.round((d.value/wTotal)*100);return React.createElement('div',{style:{background:'rgba(2,52,54,0.95)',borderRadius:10,padding:'10px 16px'}},React.createElement('p',{style:{color:'#9CEAEF',fontSize:12,margin:'0 0 4px',fontFamily:RG.fontHeading}},d.name),React.createElement('p',{style:{color:RG.surface,fontSize:16,fontWeight:700,margin:0}},d.value+' ลีด ('+pct+'%)'));}return null;
                  }}),
                  React.createElement('text',{x:'50%',y:'50%',textAnchor:'middle',dominantBaseline:'middle',style:{fontSize:28,fontWeight:800,fill:RG.text,fontFamily:RG.fontHeading}},winLoss.reduce((s,i)=>s+i.value,0))
                )
              ),
              React.createElement('div',{style:{display:'flex',justifyContent:'center',gap:16,marginTop:8}},
                winLoss.map(e=>React.createElement('div',{key:e.name,style:{display:'flex',alignItems:'center',gap:8}},
                  React.createElement('div',{style:{width:10,height:10,borderRadius:'50%',background:e.fill}}),
                  React.createElement('span',{style:{fontSize:12,color:RG.text,fontWeight:600}},e.name,' (',e.value,')')
                ))
              )
            )
        )
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
                    pie.map(e=>React.createElement(Cell,{key:e.name,fill:STAGE_COLORS[e.name]||'#ccc',stroke:'none'}))
                  ),
                  React.createElement(Tooltip,{content:({active,payload})=>{
                    if(active&&payload?.length){const d=payload[0];const pct=Math.round((d.value/total)*100);return React.createElement('div',{style:{background:'rgba(2,52,54,0.95)',borderRadius:10,padding:'10px 16px'}},React.createElement('p',{style:{color:'#9CEAEF',fontSize:12,margin:'0 0 4px',fontFamily:RG.fontHeading}},d.name),React.createElement('p',{style:{color:RG.surface,fontSize:16,fontWeight:700,margin:0}},d.value+' ลีด ('+pct+'%)'));}return null;
                  }}),
                  React.createElement('text',{x:'50%',y:'43%',textAnchor:'middle',dominantBaseline:'middle',style:{fontSize:32,fontWeight:800,fill:RG.text,fontFamily:RG.fontHeading}},total),
                  React.createElement('text',{x:'50%',y:'57%',textAnchor:'middle',dominantBaseline:'middle',style:{fontSize:11,fill:RG.textMuted,fontFamily:RG.fontBody}},'ลีดทั้งหมด')
                )
              ),
              React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px',marginTop:8}},
                pie.map(e=>React.createElement('div',{key:e.name,style:{display:'flex',alignItems:'center',gap:8}},
                  React.createElement('div',{style:{width:10,height:10,borderRadius:'50%',background:STAGE_COLORS[e.name]||'#ccc',flexShrink:0}}),
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
                React.createElement(Area,{type:'monotone',dataKey:'ติดตาม',stroke:RG.primary,strokeWidth:2.5,fill:'url(#gT)',dot:{r:5,fill:RG.primary,strokeWidth:2,stroke:RG.surface},activeDot:{r:7},isAnimationActive:!isExporting}),
                React.createElement(Area,{type:'monotone',dataKey:'ปิดการขาย',stroke:RG.success,strokeWidth:2.5,fill:'url(#gP)',dot:{r:5,fill:RG.success,strokeWidth:2,stroke:RG.surface},activeDot:{r:7},isAnimationActive:!isExporting})
              )
            )
        )
      ),

      React.createElement('div',{style:{display:'grid',gridTemplateColumns:isExporting?'1fr':'1fr 1fr',gap:24,marginBottom:24}},
        /* Hot Deals & High-Value Opportunities */
        React.createElement('div', { style: crd(isExporting) },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('span', { style: { fontSize: 20 } }, '🔥'),
              React.createElement('h4', { style: { margin: 0, color: RG.text, fontSize: 16, fontWeight: 700, fontFamily: RG.fontHeading } }, 'Hot Deals & High-Value Opportunities'),
              React.createElement('span', { style: { fontSize: 12, color: RG.textMuted } }, '(5 อันดับ)')
            )
          ),
          hotDeals.length === 0
            ? React.createElement('div', { style: { textAlign: 'center', padding: '24px', color: RG.textMuted, fontSize: 13 } }, 'ไม่มีดีลมูลค่าสูงในขณะนี้')
            : React.createElement('div', { style: { overflowX: 'auto' } },
                React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 } },
                  React.createElement('thead', null,
                    React.createElement('tr', { style: { borderBottom: `2px solid ${RG.border}`, background: RG.background } },
                      React.createElement('th', { style: { padding: '10px 12px', textAlign: 'left', color: RG.textMuted, fontWeight: 600 } }, 'บริษัท / ลูกค้า'),
                      React.createElement('th', { style: { padding: '10px 12px', textAlign: 'right', color: RG.textMuted, fontWeight: 600 } }, 'มูลค่าดีล'),
                      React.createElement('th', { style: { padding: '10px 12px', textAlign: 'center', color: RG.textMuted, fontWeight: 600 } }, 'Stage'),
                      React.createElement('th', { style: { padding: '10px 12px', textAlign: 'left', color: RG.textMuted, fontWeight: 600 } }, 'เซลส์ผู้ดูแล')
                    )
                  ),
                  React.createElement('tbody', null,
                    hotDeals.map(d => React.createElement('tr', { key: d.id, style: { borderBottom: `1px solid ${RG.border}`, cursor: onSelectLead ? 'pointer' : 'default' }, onClick: () => onSelectLead && onSelectLead(d) },
                      React.createElement('td', { style: { padding: '12px', fontWeight: 600, color: RG.text } }, d.companyName),
                      React.createElement('td', { style: { padding: '12px', textAlign: 'right', fontWeight: 700, color: RG.primaryMid } }, `฿${(Number(d.dealValue) || 0).toLocaleString()}`),
                      React.createElement('td', { style: { padding: '12px', textAlign: 'center' } },
                        React.createElement('span', { style: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: (STAGE_COLORS[d.stage] || '#3B82F6') + '22', color: STAGE_COLORS[d.stage] || RG.text } }, d.stage || 'Contact')
                      ),
                      React.createElement('td', { style: { padding: '12px', color: RG.primaryMid, fontWeight: 600 } }, d.owner || '-')
                    ))
                  )
                )
              )
        ),
        /* Monthly Conversion */
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
        )
      ),

      isExporting&&React.createElement('div',{style:{marginTop:50,borderTop:'2px solid #e2e8f0',paddingTop:20,display:'flex',justifyContent:'space-between',color:RG.textMuted,fontSize:13}},
        React.createElement('div',null,'© 2026 Sales_CRM System. All rights reserved.'),
        React.createElement('div',null,'รายงานสำหรับใช้ภายในองค์กรเท่านั้น (Internal Use Only)')
      )
    ),

    showModal&&React.createElement(Modal,{title:'กรองข้อมูลตามช่วงเวลา',onClose:()=>setShowModal(false),width:450},
      React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:16,padding:'8px 4px'}},
        React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6}},
          React.createElement('label',{style:{fontSize:13,fontWeight:600,color:RG.text}},'ช่วงเวลาที่ต้องการกรอง:'),
          React.createElement('select',{value:dr.type||'all',onChange:(e)=>setDr({...getPresetRange(e.target.value),type:e.target.value}),style:{...inputStyle,width:'100%',padding:'10px 12px'}},
            React.createElement('option',{value:'today'},'วันนี้'),
            React.createElement('option',{value:'thismonth'},'เดือนนี้'),
            React.createElement('option',{value:'lastmonth'},'เดือนที่แล้ว'),
            React.createElement('option',{value:'thisquarter'},'ไตรมาสนี้'),
            React.createElement('option',{value:'lastquarter'},'ไตรมาสที่แล้ว'),
            React.createElement('option',{value:'last6months'},'6 เดือนล่าสุด (ค่าเริ่มต้น)'),
            React.createElement('option',{value:'thisyear'},'ปีนี้'),
            React.createElement('option',{value:'all'},'ทั้งหมด (ไม่กรอง)'),
            React.createElement('option',{value:'custom'},'กำหนดช่วงเวลาเอง (ไม่เกิน 1 ปี)')
          )
        ),
        dr.type==='custom'&&React.createElement('div',{style:{display:'flex',gap:12,alignItems:'center',background:RG.background,padding:'12px',borderRadius:'8px',border:'1px solid '+RG.border}},
          React.createElement('div',{style:{flex:1,display:'flex',flexDirection:'column',gap:4}},
            React.createElement('span',{style:{fontSize:11,color:RG.textMuted,fontWeight:600}},'เริ่มต้น:'),
            React.createElement('input',{type:'date',value:dr.min||'',onChange:e=>{const next={...dr,min:e.target.value,type:'custom'};if(chkYear(next.min,next.max))setDr(next);},style:{...inputStyle,width:'100%'}})
          ),
          React.createElement('span',{style:{color:RG.textMuted,marginTop:16}},'ถึง'),
          React.createElement('div',{style:{flex:1,display:'flex',flexDirection:'column',gap:4}},
            React.createElement('span',{style:{fontSize:11,color:RG.textMuted,fontWeight:600}},'สิ้นสุด:'),
            React.createElement('input',{type:'date',value:dr.max||'',onChange:e=>{const next={...dr,max:e.target.value,type:'custom'};if(chkYear(next.min,next.max))setDr(next);},style:{...inputStyle,width:'100%'}})
          )
        ),
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',marginTop:16,paddingTop:12,borderTop:'1px solid '+RG.border}},
          React.createElement('button',{onClick:()=>setDr({...getPresetRange('last6months'),type:'last6months'}),style:{padding:'8px 16px',borderRadius:8,border:'1px solid '+RG.border,background:RG.surface,color:RG.textMuted,cursor:'pointer',fontWeight:600,fontSize:13}},'รีเซ็ตเป็นค่าเริ่มต้น'),
          React.createElement('button',{onClick:()=>setShowModal(false),style:{padding:'8px 24px',borderRadius:8,border:'none',background:RG.primary,color:RG.surface,cursor:'pointer',fontWeight:600,fontSize:13}},'ตกลง')
        )
      )
    )
  );
}