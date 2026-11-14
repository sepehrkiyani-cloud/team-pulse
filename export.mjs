import ExcelJS from 'exceljs';
import {descriptionEntries} from './dashboard.mjs';
const statuses={todo:'شروع‌نشده',doing:'در حال انجام',blocked:'متوقف‌شده',done:'انجام‌شده'};
const date=s=>s?new Date(s).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}):'';
export async function taskWorkbook(tasks,now=Date.now()){
 const book=new ExcelJS.Workbook();book.creator='نبض تیم مدیریت';book.created=new Date(now);
 const sheet=book.addWorksheet('آخرین وضعیت',{views:[{rightToLeft:true,state:'frozen',ySplit:1}]});
 sheet.columns=[['پروژه','project',24],['عنوان تسک','title',36],['وضعیت','status',20],['مسئول پیگیری','owner',23],['مدیر پروژه','manager',23],['آخرین توضیح','description',65],['نویسندهٔ آخرین توضیح','author',24],['زمان آخرین توضیح (تهران)','descriptionAt',28],['ساعت از آخرین توضیح','elapsed',25],['اقدام بعدی','nextStep',45],['مانع / نیاز به تصمیم','blocker',45],['گزارش وضعیت','note',45],['زمان اقدام (تهران)','actionAt',28],['آخرین تغییر (تهران)','updatedAt',28],['ثبت‌کنندهٔ آخرین تغییر','updatedBy',24]].map(([header,key,width])=>({header,key,width}));
 const notes=book.addWorksheet('فهرست توضیحات',{views:[{rightToLeft:true,state:'frozen',ySplit:1}]});notes.columns=[{header:'پروژه',key:'project',width:24},{header:'عنوان تسک',key:'title',width:36},{header:'توضیحات',key:'text',width:85},{header:'نویسنده',key:'author',width:24},{header:'تاریخ ثبت (تهران)',key:'at',width:28}];
 for(const t of tasks){const entries=descriptionEntries(t),last=entries[0];sheet.addRow({project:t.projectName||'',title:t.title,status:statuses[t.status]||t.status,owner:t.followUpOwner||'',manager:t.projectManager||'',description:last?.text||'',author:last?.by||'',descriptionAt:date(last?.at),elapsed:last?.at?Math.max(0,Math.round((now-Date.parse(last.at))/36000)/100):null,nextStep:t.nextStep||'',blocker:t.blocker||'',note:t.note||'',actionAt:date(t.actionAt),updatedAt:date(t.updatedAt),updatedBy:t.updatedBy||''});for(const n of entries)notes.addRow({project:t.projectName||'',title:t.title,text:n.text,author:n.by||'',at:date(n.at)})}
 for(const ws of [sheet,notes]){
  ws.autoFilter={from:{row:1,column:1},to:{row:1,column:ws.columnCount}};
  ws.getRow(1).height=32;
  ws.getRow(1).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF006BA6'}};c.font={name:'Tahoma',bold:true,color:{argb:'FFFFFFFF'},size:11};c.alignment={horizontal:'right',vertical:'middle',wrapText:true}});
  ws.eachRow((row,i)=>{if(i===1)return;row.eachCell(c=>{
   c.font={name:'Tahoma',size:10};c.alignment={horizontal:'right',vertical:'top',wrapText:true};
   if(i%2===0)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F7FC'}};
  });});
 }
 sheet.getColumn('elapsed').numFmt='0.00';return book.xlsx.writeBuffer();
}
