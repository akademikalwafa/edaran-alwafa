// SE Akademik — SPA instant: navigasi = show/hide, data di-cache localStorage, sinkron di latar belakang.
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
let S=ld('se_state',null),T=localStorage.getItem('se_token')||'';
let W={step:1,jenis:'',v:null,res:null},R={q:'',j:'',y:'',m:'',p:1},TAB='jenis';

async function api(action,data){
  const r=await fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:T,data})});
  const j=await r.json();
  if(j.code===401){keluar(true);throw new Error(j.message)}
  if(!j.success)throw new Error(j.message);return j.data;
}
function toast(m,e){const t=$('#toast');t.textContent=m;t.className='on'+(e?' e':'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='',2800)}
const save=()=>localStorage.setItem('se_state',JSON.stringify(S));
function dl(name,b64){const b=atob(b64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([u],{type:'application/pdf'}));a.download=name;a.click()}
const pad=n=>String(n).padStart(3,'0'),today=()=>new Date().toISOString().slice(0,10);
const tipe=k=>/(^|_)rentang(_|$)/.test(k)?'range':/(^|_)tanggal(_|$)/.test(k)?'date':/_jam$/.test(k)?'time':/_biaya$/.test(k)?'number':/_teks$/.test(k)?'area':'text';
const idt=s=>{const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?(+m[3])+' '+BLN[+m[2]-1]+' '+m[1]:s};
const RG=/^\d{4}-\d{2}-\d{2}\|\d{4}-\d{2}-\d{2}$/;
const rg=(v,at,m)=>{const a=String(v||'').split('|');return `<div style="display:flex;gap:6px;align-items:center;margin:${m}"><input type="date" ${at} data-p="0" value="${a[0]||''}" style="margin:0"><span>s/d</span><input type="date" ${at} data-p="1" value="${a[1]||''}" style="margin:0"></div>`};
const lst=k=>(S.opsi||[]).filter(o=>o.k===k);
const isSel=k=>['semester','tahun_akademik','perihal'].includes(k)||lst(k).length>0;
const selF=(at,k,v)=>`<select ${at}><option value="">— pilih —</option>${lst(k).map(o=>`<option value="${esc(o.v)}" ${o.v===v?'selected':''}>${esc(o.v)}</option>`).join('')}${v&&!lst(k).some(o=>o.v===v)?`<option value="${esc(v)}" selected>${esc(v)}</option>`:''}<option value="__baru">＋ Tambah pilihan baru…</option></select>`;
const pk=t=>{const p=(J()||{skema:{}}).skema.pakai;if(!p)return true;return t==='tgl'?p.some(k=>k==='tanggal_surat'||k==='kota_tanggal'):t==='perihal'?p.includes('perihal'):p.some(k=>/pejabat$/.test(k))};
const isAd=()=>S&&S.user.role==='Admin';

// ---------- Login / sesi ----------
$('#lf').onsubmit=async e=>{e.preventDefault();const b=$('#lb');b.disabled=true;b.textContent='Memeriksa…';$('#lerr').hidden=true;
  try{const r=await api('login',{username:$('#lu').value,password:$('#lp').value});T=r.token;localStorage.setItem('se_token',T);
    S=await api('boot');save();start()}catch(x){$('#lerr').textContent=x.message;$('#lerr').hidden=false}
  b.disabled=false;b.textContent='Masuk →'};
function keluar(silent){if(!silent&&T)api('logout').catch(()=>{});T='';S=null;localStorage.removeItem('se_token');localStorage.removeItem('se_state');
  $('#app').hidden=true;$('#login').hidden=false;$('#lp').value=''}
$('#out').onclick=()=>keluar();
$('#who').onclick=async()=>{const l=prompt('Kata sandi lama:');if(!l)return;const b=prompt('Kata sandi baru (min. 6 karakter):');if(!b)return;
  try{await api('gantiPw',{lama:l,baru:b});toast('Kata sandi diganti')}catch(e){toast(e.message,1)}};
function start(){$('#login').hidden=true;$('#app').hidden=false;$('#who').textContent='👤 '+S.user.n;$('#who').style.cursor='pointer';
  $('#nav').innerHTML='<h3>SE Akademik</h3>'+[['buat','＋ Buat Surat'],['riwayat','↺ Riwayat Surat']].concat(isAd()?[['atur','⚙ Pengaturan']]:[]).map(m=>`<button data-p="${m[0]}">${m[1]}</button>`).join('');
  newWiz();drawAll();go(ld('se_pg','buat'))}
async function refresh(){try{S=await api('boot');save();drawAll()}catch(e){if(T)toast('Sinkronisasi gagal: '+e.message,1)}}

// ---------- Navigasi instan ----------
function go(p){if(p==='atur'&&!isAd())p='buat';$$('.pg').forEach(e=>e.classList.toggle('on',e.id==='pg-'+p));
  $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));localStorage.setItem('se_pg',JSON.stringify(p))}
function drawAll(){drawBuat();drawRiwayat();if(isAd())drawAtur()}

// ---------- Buat Surat ----------
function newWiz(){W={step:1,jenis:'',v:{tanggal:today(),perihal:'',pejabat:'',isian:{}},res:null}}
const J=()=>S.jenis.find(x=>x.id===W.jenis);
function nextNo(){const y=+(W.v.tanggal||today()).slice(0,4),m=+(W.v.tanggal||today()).slice(5,7),n=S.nomor.find(x=>x.tahun===y);
  return pad((n?n.last:0)+1)+'/'+S.cfg.kode_surat+'/'+ROM[m-1]+'/'+y}
function problems(){const p=[],j=J();if(pk('perihal')&&!W.v.perihal.trim())p.push('Perihal');if(pk('pej')&&!W.v.pejabat)p.push('Pejabat');
  ((j&&j.skema.fields)||[]).forEach(f=>{const x=String(W.v.isian[f.k]||'').trim();if(!x||(tipe(f.k)==='range'&&(!RG.test(x)||x.split('|')[1]<x.split('|')[0])))p.push(f.label)});return p}
function drawBuat(){
  const st=W.step,j=J(),el=$('#pg-buat');
  const body=[()=>`<div class="card"><h3>Pilih Jenis Surat</h3><p class="mut">Pilih kategori surat edaran yang akan diterbitkan.</p><div class="jg">${S.jenis.filter(x=>x.aktif).map(x=>`<button class="jc ${x.id===W.jenis?'on':''}" data-act="pilih" data-id="${x.id}">${esc(x.nama)}</button>`).join('')||'<p class="mut">Belum ada jenis surat aktif. Admin dapat menambahkannya di Pengaturan.</p>'}</div></div>`,
  ()=>`<div class="card"><h3>${esc(j.nama)}</h3><div class="row2">
    ${pk('tgl')?`<div><label>Tanggal Surat</label><input type="date" data-f="tanggal" value="${W.v.tanggal}"></div>`:''}
    ${pk('perihal')?`<div><label>Perihal</label>${selF('data-f="perihal"','perihal',W.v.perihal)}</div>`:''}
    ${pk('pej')?`<div><label>Pejabat Penanda Tangan</label><select data-f="pejabat"><option value="">— pilih —</option>${S.pejabat.filter(x=>x.aktif).map(x=>`<option value="${x.id}" ${x.id===W.v.pejabat?'selected':''}>${esc(x.nama)} (${esc(x.jabatan)})</option>`).join('')}</select></div>`:''}
    ${(j.skema.fields||[]).map(f=>{const t=tipe(f.k),v=esc(W.v.isian[f.k]||'');return `<div><label>${esc(f.label)}</label>${isSel(f.k)?selF(`data-k="${f.k}"`,f.k,W.v.isian[f.k]):t==='area'?`<textarea rows="3" data-k="${f.k}">${v}</textarea>`:t==='range'?rg(W.v.isian[f.k],`data-k="${f.k}"`,'4px 0 12px'):`<input type="${t}" data-k="${f.k}" value="${v}">`}</div>`}).join('')}</div>
    ${(j.skema.tables||[]).map(t=>tbl(t)).join('')}
    <div class="bar"><button class="ghost" data-act="back">← Ganti Jenis</button><button class="ghost" data-act="draft">Simpan Draft</button><button class="btn" data-act="lanjut">Lanjut ke Pratinjau →</button></div></div>`,
  ()=>`<div class="card"><h3>Pratinjau Surat</h3><p class="mut">Nomor surat: <b>${esc(nextNo())}</b> — pratinjau memakai template asli.</p><div id="pvbox"></div>
    <div class="bar" style="margin-top:12px"><button class="ghost" data-act="edit">← Ubah</button><button class="btn" id="mk" data-act="buat">Buat Surat</button></div></div>`,
  ()=>`<div class="card"><h3>✅ Surat berhasil dibuat</h3><p>Nomor: <b>${esc(W.res.row.no)}</b><br>${esc(W.res.name)}</p><div class="bar"><button class="ghost" data-act="baru">Buat Surat Lain</button><button class="btn" data-act="unduh">Unduh PDF</button></div></div>`][st-1]();
  el.innerHTML=`<div class="top"><div><small>STIS AL WAFA - AKADEMIK</small><h1>Buat Surat Edaran Akademik</h1></div><ol class="steps">${['Pilih Jenis','Isi Formulir','Pratinjau','Hasil'].map((t,i)=>`<li data-n="${i+1}" class="${st===i+1?'on':st>i+1?'done':''}"> ${t}</li>`).join('')}</ol></div><div class="grid2"><div>${body}</div><aside id="side"></aside></div>`;
  drawSide();if(st===3)drawPv()}
function tbl(t){const rows=W.v.isian[t.n]||(W.v.isian[t.n]=[{}]);
  return `<h3 style="margin-top:14px">${esc(t.n.replace(/_/g,' '))}</h3><div class="wrap"><table><tr><th>No</th>${t.cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}<th></th></tr>
  ${rows.map((r,i)=>`<tr><td>${i+1}</td>${t.cols.map(c=>`<td>${tipe(c.k)==='range'?rg(r[c.k],`data-tn="${t.n}" data-i="${i}" data-c="${c.k}"`,'0'):`<input type="${tipe(c.k)==='area'?'text':tipe(c.k)}" data-tn="${t.n}" data-i="${i}" data-c="${c.k}" value="${esc(r[c.k]||'')}">`}</td>`).join('')}<td><button class="ghost sm" data-act="del" data-tn="${t.n}" data-i="${i}">✕</button></td></tr>`).join('')}</table></div><button class="ghost sm" data-act="add" data-tn="${t.n}">+ Tambah Baris</button>`}
function drawSide(){const j=J(),p=W.step>1&&j?problems():[],pj=S.pejabat.find(x=>x.id===(W.v&&W.v.pejabat));
  $('#side').innerHTML=`<div class="card"><small>NOMOR SURAT BERIKUTNYA</small><h2>${pad((S.nomor.find(x=>x.tahun===+W.v.tanggal.slice(0,4))||{last:0}).last+1)}</h2></div>
  <div class="card"><h3>Checklist Validasi</h3><ul class="chk"><li class="y">Format nomor sesuai standar</li><li class="${!pk('pej')||W.v.pejabat?'y':'n'}">Pejabat penanda tangan dipilih</li><li class="${W.step>1&&!p.length?'y':'n'}">Semua kolom wajib terisi</li></ul></div>
  <div class="card"><h3>Pratinjau</h3><p class="mut" style="font-size:13px">Pratinjau surat asli (dari template Google Docs) tampil di langkah 3.</p>${W.step===2?'<button class="ghost" style="width:100%" data-act="lanjut">👁 Lihat Pratinjau Surat</button>':''}</div>`}
function put(o,k,t){if(t.dataset.p!=null){const a=String(o[k]||'|').split('|');a[+t.dataset.p]=t.value;o[k]=a.join('|')}else o[k]=t.value}
function setV(t){if(t.dataset.f)W.v[t.dataset.f]=t.value;
  else if(t.dataset.k)put(W.v.isian,t.dataset.k,t);
  else if(t.dataset.tn)put(W.v.isian[t.dataset.tn][+t.dataset.i],t.dataset.c,t);
  drawSide()}
async function tambahOpsi(t){const key=t.dataset.f||t.dataset.k,nm=prompt('Tambah pilihan baru:');
  if(!nm||!nm.trim()){drawBuat();return}
  const val=nm.trim();let ex=lst(key).find(o=>o.v.toLowerCase()===val.toLowerCase());
  if(!ex){ex={id:'t'+Date.now(),k:key,v:val};(S.opsi=S.opsi||[]).push(ex);save();
    api('saveOpsi',{kunci:key,nilai:val}).then(r=>{ex.id=r.id;save()}).catch(e=>toast(e.message,1))}
  if(t.dataset.f)W.v[key]=ex.v;else W.v.isian[key]=ex.v;drawBuat()}
let PV=0;
const payload=()=>({jenis:W.jenis,tanggal:W.v.tanggal,perihal:W.v.perihal||J().nama,pejabat:W.v.pejabat,isian:W.v.isian});
async function loadPv(){const n=++PV;W.pv=null;W.pverr='';drawPv();
  try{const r=await api('preview',payload());if(n!==PV)return;const b=atob(r.b64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);W.pv=URL.createObjectURL(new Blob([u],{type:'application/pdf'}))}catch(e){if(n!==PV)return;W.pverr=e.message}
  drawPv()}
function drawPv(){const el=$('#pvbox');if(!el||W.step!==3)return;
  el.innerHTML=W.pverr?`<p class="err">${esc(W.pverr)}</p>`:W.pv?`<iframe src="${W.pv}" style="width:100%;height:72vh;border:1px solid var(--l);border-radius:8px"></iframe><p><a href="${W.pv}" target="_blank">Buka pratinjau di tab baru</a></p>`:'<p class="mut">⏳ Menyiapkan pratinjau dari template… (±5–15 detik)</p>'}
async function doBuat(){const b=$('#mk');b.disabled=true;b.textContent='Membuat PDF…';
  try{const r=await api('buat',payload());
    S.riwayat.unshift(r.row);const n=S.nomor.find(x=>x.tahun===r.nomor.tahun);n?n.last=r.nomor.last:S.nomor.push(r.nomor);save();
    W.res=r;W.step=4;drawBuat();drawRiwayat();dl(r.name,r.b64)}catch(e){toast(e.message,1);b.disabled=false;b.textContent='Buat Surat'}}

// ---------- Riwayat (filter lokal = instan) ----------
function drawRiwayat(){const ys=[...new Set(S.riwayat.map(r=>r.tgl.slice(0,4)))].sort().reverse();
  const ak=S.riwayat.filter(r=>r.status==='Aktif').length;
  $('#pg-riwayat').innerHTML=`<div class="top"><div><h1>Riwayat Surat</h1><p class="mut">Semua surat edaran yang pernah dibuat.</p></div><button class="btn" data-act="newgo">+ Buat Surat Baru</button></div>
  <div class="stats"><div class="card"><small>TOTAL SURAT</small><b>${S.riwayat.length}</b></div><div class="card"><small>SURAT AKTIF</small><b>${ak}</b></div><div class="card"><small>DIBATALKAN</small><b>${S.riwayat.length-ak}</b></div></div>
  <div class="card row2" style="grid-template-columns:2fr 1fr 1fr 1fr"><input data-r="q" placeholder="Cari nomor atau perihal…" value="${esc(R.q)}"><select data-r="j"><option value="">Semua Jenis</option>${S.jenis.map(x=>`<option value="${x.id}" ${R.j===x.id?'selected':''}>${esc(x.nama)}</option>`).join('')}</select>
  <select data-r="m"><option value="">Semua Bulan</option>${BLN.map((b,i)=>`<option value="${pad(i+1).slice(1)}" ${R.m===pad(i+1).slice(1)?'selected':''}>${b}</option>`).join('')}</select><select data-r="y"><option value="">Semua Tahun</option>${ys.map(y=>`<option ${R.y===y?'selected':''}>${y}</option>`).join('')}</select></div>
  <div class="card wrap" id="rl"></div>`;drawRl()}
function drawRl(){const q=R.q.toLowerCase(),f=S.riwayat.filter(r=>(!q||(r.no+' '+r.perihal).toLowerCase().includes(q))&&(!R.j||r.jenis===R.j)&&(!R.y||r.tgl.slice(0,4)===R.y)&&(!R.m||r.tgl.slice(5,7)===R.m));
  const pg=Math.max(1,Math.ceil(f.length/10));R.p=Math.min(R.p,pg);const rows=f.slice((R.p-1)*10,R.p*10);
  $('#rl').innerHTML=`<table><tr><th>Nomor</th><th>Tanggal</th><th>Jenis</th><th>Perihal</th><th>Oleh</th><th>Status</th><th></th></tr>${rows.map(r=>{const j=S.jenis.find(x=>x.id===r.jenis);
    return `<tr><td style="font-family:monospace;${r.status!=='Aktif'?'text-decoration:line-through':''}">${esc(r.no)}${r.sumber==='Surat Lama'?' <span class="pill">Lama</span>':''}</td><td>${idt(r.tgl)}</td><td>${esc(j?j.nama:'-')}</td><td>${esc(r.perihal)}</td><td>${esc(r.oleh)}</td><td><span class="pill ${r.status==='Aktif'?'ok':'x'}">${esc(r.status)}</span></td>
    <td style="white-space:nowrap">${r.pdf?`<button class="ghost sm" data-act="pdf" data-id="${r.id}">⬇ PDF</button>`:''}${isAd()&&r.status==='Aktif'?` <button class="ghost sm" data-act="batal" data-id="${r.id}">Batalkan</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7" class="mut">Belum ada surat.</td></tr>'}</table>
  <div class="bar" style="margin-top:10px;align-items:center"><small>${f.length} surat</small><button class="ghost sm" data-act="pg" data-d="-1">‹</button><b>${R.p}/${pg}</b><button class="ghost sm" data-act="pg" data-d="1">›</button></div>`}

// ---------- Pengaturan (Admin) ----------
function drawAtur(){const tabs=[['jenis','Jenis Surat & Template'],['pejabat','Direktori Pejabat'],['nomor','Penomoran'],['user','Pengguna'],['opsi','Pilihan Isian']];
  const L={jenis:()=>S.jenis.map(x=>`<tr><td>${esc(x.nama)}</td><td>${(x.skema.fields||[]).length+(x.skema.tables||[]).length} kolom</td><td><span class="pill ${x.aktif?'ok':'x'}">${x.aktif?'Aktif':'Nonaktif'}</span></td><td><button class="ghost sm" data-act="ej" data-id="${x.id}">Edit</button> <button class="ghost sm" data-act="tj" data-id="${x.id}">${x.aktif?'Nonaktifkan':'Aktifkan'}</button></td></tr>`).join(''),
  pejabat:()=>S.pejabat.map(x=>`<tr><td>${esc(x.nama)}</td><td>${esc(x.jabatan)}</td><td>${esc(x.nidn)}</td><td><button class="ghost sm" data-act="ep" data-id="${x.id}">Edit</button> <button class="ghost sm" data-act="tp" data-id="${x.id}">${x.aktif?'Nonaktifkan':'Aktifkan'}</button></td></tr>`).join(''),
  nomor:()=>S.nomor.map(x=>`<tr><td>${x.tahun}</td><td>${x.last}</td><td><button class="ghost sm" data-act="en" data-y="${x.tahun}">Ubah</button></td></tr>`).join(''),
  user:()=>S.users.map(x=>`<tr><td>${esc(x.u)}</td><td>${esc(x.n)}</td><td>${x.role}</td><td><span class="pill ${x.aktif?'ok':'x'}">${x.aktif?'Aktif':'Nonaktif'}</span></td><td>${x.role==='Admin'?'':`<button class="ghost sm" data-act="rp" data-id="${x.id}">Reset Sandi</button> <button class="ghost sm" data-act="tu" data-id="${x.id}">${x.aktif?'Nonaktifkan':'Aktifkan'}</button>`}</td></tr>`).join('')};
  L.opsi=()=>(S.opsi||[]).map(x=>`<tr><td>${esc(x.k)}</td><td>${esc(x.v)}</td><td><button class="ghost sm" data-act="dopsi" data-id="${x.id}">Hapus</button></td></tr>`).join('');
  const H={jenis:'<th>Nama</th><th>Kolom</th><th>Status</th><th></th>',pejabat:'<th>Nama</th><th>Jabatan</th><th>NIDN</th><th></th>',nomor:'<th>Tahun</th><th>Nomor Terakhir</th><th></th>',user:'<th>Username</th><th>Nama</th><th>Peran</th><th>Status</th><th></th>'};
  const AD={jenis:'+ Jenis Surat',pejabat:'+ Pejabat',nomor:'+ Tahun',user:'+ Pengguna'};H.opsi='<th>Kolom</th><th>Pilihan</th><th></th>';AD.opsi='+ Pilihan';
  $('#pg-atur').innerHTML=`<h1>Pengaturan Sistem</h1><div class="tabs">${tabs.map(t=>`<button data-act="tab" data-t="${t[0]}" class="${TAB===t[0]?'on':''}">${t[1]}</button>`).join('')}</div><div class="card wrap"><div class="bar" style="margin-bottom:10px"><button class="btn sm" data-act="add${TAB}">${AD[TAB]}</button></div><table><tr>${H[TAB]}</tr>${L[TAB]()}</table></div>`}
function form(title,fields,onOk){const d=$('#dlg');
  d.innerHTML=`<h3>${title}</h3><form method="dialog" id="df">${fields.map(f=>`<label>${f.l}</label><input name="${f.k}" type="${f.t||'text'}" value="${esc(f.v||'')}">`).join('')}<div class="bar"><button type="button" class="ghost" id="dc">Batal</button><button class="btn" id="dk">Simpan</button></div></form>`;
  $('#dc').onclick=()=>d.close();d.showModal();
  $('#df').onsubmit=async e=>{e.preventDefault();const o={};fields.forEach(f=>o[f.k]=e.target.elements[f.k].value);$('#dk').disabled=true;
    try{await onOk(o);d.close();await refresh()}catch(x){toast(x.message,1);$('#dk').disabled=false}}}
async function jenisForm(x){form(x?'Edit Jenis Surat':'Tambah Jenis Surat',[{k:'nama',l:'Nama jenis',v:x&&x.nama},{k:'doc',l:'Tautan / ID template Google Docs',v:x&&x.doc}],async o=>{
  const sc=await api('scan',{doc:o.doc});
  setTimeout(()=>{if(sc.warn.length)toast('Placeholder tidak dikenal: '+sc.warn.join(', '),1);
    const fl=sc.skema.fields.concat(...sc.skema.tables.map(t=>t.cols));
    form('Atur label kolom ('+fl.length+' kolom terdeteksi)',fl.map(f=>({k:f.k,l:f.k,v:f.label})),async lb=>{
      sc.skema.fields.forEach(f=>f.label=lb[f.k]);sc.skema.tables.forEach(t=>t.cols.forEach(c=>c.label=lb[c.k]));
      await api('saveJenis',{id:x&&x.id,nama:o.nama,doc:o.doc,skema:sc.skema,aktif:x?x.aktif:true});toast('Jenis surat tersimpan')})},50)})}

// ---------- Event delegation ----------
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.r){R[t.dataset.r]=t.value;R.p=1;drawRl()}else if(t.value==='__baru'){}else if(W.v&&(t.dataset.f||t.dataset.k||t.dataset.tn)){setV(t);localStorage.setItem('se_draft',JSON.stringify({j:W.jenis,v:W.v}))}});
document.addEventListener('change',e=>{if(e.target.dataset.r){R[e.target.dataset.r]=e.target.value;R.p=1;drawRl()}else if(e.target.value==='__baru')tambahOpsi(e.target)});
document.addEventListener('click',async e=>{
  if(e.target.type==='date'){try{e.target.showPicker()}catch(x){}}
  const nb=e.target.closest('#nav button');if(nb)return go(nb.dataset.p);
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id,tn=b.dataset.tn;
  if(a==='pilih'){W.jenis=id;const dr=ld('se_draft',null);if(dr&&dr.j===id)W.v=dr.v;else W.v={tanggal:today(),perihal:'',pejabat:'',isian:{}};W.step=2;drawBuat()}
  else if(a==='back'){W.step=1;drawBuat()}
  else if(a==='draft'){localStorage.setItem('se_draft',JSON.stringify({j:W.jenis,v:W.v}));toast('Draft tersimpan di perangkat ini')}
  else if(a==='lanjut'){const p=problems();if(p.length)return toast('Lengkapi: '+p.join(', '),1);W.step=3;drawBuat();loadPv()}
  else if(a==='edit'){PV++;W.step=2;drawBuat()}
  else if(a==='buat')doBuat();
  else if(a==='unduh')dl(W.res.name,W.res.b64);
  else if(a==='baru'){localStorage.removeItem('se_draft');newWiz();drawBuat()}
  else if(a==='newgo'){newWiz();drawBuat();go('buat')}
  else if(a==='add'){W.v.isian[tn].push({});drawBuat()}
  else if(a==='del'){const r=W.v.isian[tn];r.splice(+b.dataset.i,1);if(!r.length)r.push({});drawBuat()}
  else if(a==='pg'){R.p=Math.max(1,R.p+ +b.dataset.d);drawRl()}
  else if(a==='pdf'){b.disabled=true;try{const r=await api('pdf',{id});dl(r.name,r.b64)}catch(x){toast(x.message,1)}b.disabled=false}
  else if(a==='batal'){const al=prompt('Alasan pembatalan:');if(al===null)return;const r=S.riwayat.find(x=>x.id===id);r.status='Dibatalkan';drawRiwayat();save();
    try{await api('batal',{id,alasan:al})}catch(x){r.status='Aktif';drawRiwayat();toast(x.message,1)}}
  else if(a==='addopsi')form('Pilihan baru',[{k:'kunci',l:'Kolom (semester / tahun_akademik / perihal / nama placeholder)',v:'perihal'},{k:'nilai',l:'Teks pilihan'}],o=>api('saveOpsi',{kunci:o.kunci,nilai:o.nilai}));
  else if(a==='dopsi'){S.opsi=S.opsi.filter(x=>x.id!==id);drawAtur();save();api('delOpsi',{id}).catch(x=>{toast(x.message,1);refresh()})}
  else if(a==='tab'){TAB=b.dataset.t;drawAtur()}
  else if(a==='addjenis')jenisForm();
  else if(a==='ej')jenisForm(S.jenis.find(x=>x.id===id));
  else if(a==='tj'){const x=S.jenis.find(x=>x.id===id);x.aktif=!x.aktif;drawAtur();drawBuat();api('saveJenis',{id,nama:x.nama,doc:x.doc,skema:x.skema,aktif:x.aktif}).catch(y=>toast(y.message,1))}
  else if(a==='addpejabat'||a==='ep'){const x=S.pejabat.find(x=>x.id===id)||{};form('Pejabat',[{k:'nama',l:'Nama',v:x.nama},{k:'jabatan',l:'Jabatan',v:x.jabatan},{k:'nidn',l:'NIDN',v:x.nidn}],o=>api('savePejabat',Object.assign({id:x.id,aktif:x.aktif!==false},o)))}
  else if(a==='tp'){const x=S.pejabat.find(x=>x.id===id);x.aktif=!x.aktif;drawAtur();api('savePejabat',x).catch(y=>toast(y.message,1))}
  else if(a==='addnomor'||a==='en'){const y=b.dataset.y||new Date().getFullYear(),x=S.nomor.find(n=>n.tahun==y)||{};
    form('Nomor terakhir',[{k:'tahun',l:'Tahun',v:y,t:'number'},{k:'last',l:'Nomor terakhir (surat berikutnya = ini + 1)',v:x.last||0,t:'number'}],async o=>{
      if(x.last!=null&&+o.last<x.last&&!confirm('Nomor lebih kecil dari yang sudah ada. Lanjutkan?'))throw new Error('Dibatalkan');await api('setNomor',o)})}
  else if(a==='adduser')form('Pengguna baru',[{k:'u',l:'Username'},{k:'n',l:'Nama lengkap'},{k:'password',l:'Kata sandi awal',t:'password'}],o=>api('saveUser',o));
  else if(a==='rp')form('Reset kata sandi',[{k:'password',l:'Kata sandi baru',t:'password'}],o=>api('resetPw',{id,password:o.password}));
  else if(a==='tu'){const x=S.users.find(x=>x.id===id);x.aktif=!x.aktif;drawAtur();api('saveUser',x).catch(y=>toast(y.message,1))}
});

// ---------- Init: tampil instan dari cache, sinkron di belakang ----------
if(T&&S){start();refresh()}
