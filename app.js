
const data = {
  subscriptions: [
    {name:"Adobe Creative Cloud", scope:"Professional", monthly:60.49, annual:725.88, next:"20 SET", tag:"Software"},
    {name:"ChatGPT Plus", scope:"Professional", monthly:22.99, annual:275.88, next:"03 OCT", tag:"Software"},
    {name:"Spotify", scope:"Personal", monthly:11.99, annual:143.88, next:"18 SET", tag:"Oci"},
    {name:"Gimnàs", scope:"Personal", monthly:39.90, annual:478.80, next:"01 OCT", tag:"Salut"}
  ],
  warranties: [
    {
      id:"macbook-pro",
      name:"MacBook Pro",
      brand:"Apple",
      model:"MacBook Pro 14”",
      scope:"Professional",
      amount:2399,
      purchaseDate:"12 SET 2026",
      expiry:"12 SET 2029",
      tag:"Tecnologia",
      purchaseType:"Online",
      seller:"Apple Store Online",
      website:"apple.com",
      address:"",
      sellerEmail:"contactus.es@euro.apple.com",
      purchaseEmail:"professional@exemple.com",
      orderNumber:"W123456789",
      notes:"Equip principal de feina.",
      documents:[
        {type:"Factura", name:"Factura_MacBook.pdf"},
        {type:"Garantia", name:"Garantia_Apple.pdf"}
      ]
    },
    {
      id:"iphone",
      name:"iPhone",
      brand:"Apple",
      model:"iPhone Pro",
      scope:"Personal",
      amount:1299,
      purchaseDate:"22 OCT 2025",
      expiry:"22 OCT 2027",
      tag:"Tecnologia",
      purchaseType:"Botiga física",
      seller:"Apple Store",
      website:"apple.com",
      address:"Passeig de Gràcia, Barcelona",
      sellerEmail:"contactus.es@euro.apple.com",
      purchaseEmail:"personal@exemple.com",
      orderNumber:"R998877",
      notes:"",
      documents:[{type:"Ticket", name:"Ticket_iPhone.jpg"}]
    },
    {
      id:"rentadora",
      name:"Rentadora",
      brand:"Bosch",
      model:"Serie 6",
      scope:"Casa",
      amount:649,
      purchaseDate:"05 GEN 2026",
      expiry:"05 GEN 2029",
      tag:"Electrodomèstics",
      purchaseType:"Online",
      seller:"MediaMarkt",
      website:"mediamarkt.es",
      address:"",
      sellerEmail:"atencionalcliente@mediamarkt.es",
      purchaseEmail:"personal@exemple.com",
      orderNumber:"MM-20482",
      notes:"Instal·lada a casa.",
      documents:[{type:"Factura", name:"Factura_Rentadora.pdf"}]
    }
  ],
  insurance: [
    {name:"Assegurança llar", scope:"Casa", monthly:35, annual:420, next:"23 OCT", tag:"Llar"},
    {name:"RC Professional", scope:"Professional", monthly:24, annual:288, next:"10 DES", tag:"Feina"},
    {name:"Assegurança cotxe", scope:"Cotxe", monthly:48.33, annual:580, next:"14 NOV", tag:"Vehicle"}
  ],
  maintenance: [
    {name:"Aerotèrmia", scope:"Casa", monthly:15, annual:180, next:"12 OCT", tag:"Climatització"},
    {name:"ITV", scope:"Cotxe", monthly:4.58, annual:55, next:"04 OCT", tag:"Vehicle"},
    {name:"Revisió cotxe", scope:"Cotxe", monthly:25, annual:300, next:"20 NOV", tag:"Vehicle"}
  ],
  digital: [
    {name:"paulaterrastudio.com", scope:"Professional", monthly:1.50, annual:18, next:"26 AGO", tag:"Domini"},
    {name:"kollendesign.com", scope:"Professional", monthly:1.50, annual:18, next:"26 AGO", tag:"Domini"},
    {name:"Hosting personal", scope:"Professional", monthly:9.90, annual:118.80, next:"11 DES", tag:"Hosting"}
  ]
};

// Normalitza les dades de mostra: cada element conserva sempre el seu àmbit com a etiqueta.
Object.values(data).forEach(items=>{
  items.forEach(item=>{
    if (!Array.isArray(item.tags) || item.tags.length===0) item.tags = item.scope ? [item.scope] : [];
  });
});

let currentView = "dashboard";
let currentFilter = "Tots";
let tagDashboardOpen = false;
let selectedWarrantyId = null;
let warrantyEditMode = false;
let selectedRecurring = null;
let recurringEditMode = false;
let addModalOpen = false;
let addType = "subscriptions";
let addContextTag = null;
let addReturnView = null;

function fmt(n) {
  return new Intl.NumberFormat("ca-ES", {style:"currency", currency:"EUR", maximumFractionDigits:2}).format(n);
}
function filtered(items) {
  if (currentFilter === "Tots") return items;
  return items.filter(x => itemHasTag(x, currentFilter));
}
function sumMonthly(items){ return filtered(items).reduce((a,b)=>a+(b.monthly||0),0); }
function sumAnnual(items){ return filtered(items).reduce((a,b)=>a+(b.annual||0),0); }

function allRecurring() {
  return [...data.subscriptions, ...data.insurance, ...data.maintenance, ...data.digital];
}

function metric(label, value, sub="") {
  return `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
}


function itemHasTag(item, tag){
  if (tag === "Tots") return true;
  if (Array.isArray(item.tags)) return item.tags.includes(tag);
  return item.scope === tag;
}

function allSections(){
  return [
    {key:"subscriptions", label:"Subscripcions"},
    {key:"warranties", label:"Compres i garanties"},
    {key:"insurance", label:"Assegurances"},
    {key:"maintenance", label:"Manteniments"},
    {key:"digital", label:"Dominis i digital"}
  ];
}

function getAllItemsForTag(tag){
  const result = [];
  allSections().forEach(section=>{
    (data[section.key] || []).forEach(item=>{
      if (itemHasTag(item, tag)) result.push({...item, _section:section.key, _sectionLabel:section.label});
    });
  });
  return result;
}

function recurringEquivalentMonthly(item){
  if (typeof item.monthly === "number" && item.monthly > 0) return item.monthly;
  if (typeof item.annual === "number" && item.annual > 0) return item.annual / 12;
  return 0;
}

function recurringAnnual(item){
  if (typeof item.annual === "number" && item.annual > 0) return item.annual;
  if (typeof item.monthly === "number" && item.monthly > 0) return item.monthly * 12;
  return 0;
}

function tagMetrics(tag){
  const items = getAllItemsForTag(tag);
  const recurring = items.filter(i=>i._section !== "warranties");
  const monthly = recurring.reduce((s,i)=>s+recurringEquivalentMonthly(i),0);
  const annual = recurring.reduce((s,i)=>s+recurringAnnual(i),0);

  // Prototype estimates for actual month / next month: use recurring monthly items + annual items
  // whose "next" looks like current/next month. If dates are not parseable, monthly items still count.
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth()+1, 1);

  function paymentForMonth(item, monthDate){
    if (item._section === "warranties") return 0;
    let value = (typeof item.monthly==="number" ? item.monthly : 0);
    if (value > 0) return value;
    if (!(typeof item.annual==="number" && item.annual>0)) return 0;

    const raw = item.next || "";
    const parts = raw.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (!parts) return 0;
    const mm = Number(parts[2])-1;
    const yy = parts[3] ? Number(parts[3].length===2 ? "20"+parts[3] : parts[3]) : monthDate.getFullYear();
    return (mm===monthDate.getMonth() && yy===monthDate.getFullYear()) ? item.annual : 0;
  }

  const thisMonth = recurring.reduce((s,i)=>s+paymentForMonth(i,now),0);
  const nextMonthCost = recurring.reduce((s,i)=>s+paymentForMonth(i,nextMonth),0);

  return {items, monthly, annual, thisMonth, nextMonthCost};
}

function sectionCostForTag(key, tag){
  return (data[key] || []).filter(i=>itemHasTag(i,tag)).reduce((s,i)=>{
    if (key==="warranties") return s;
    return s + recurringAnnual(i);
  },0);
}

function renderAnnualBars(tag){
  const m = tagMetrics(tag);
  const base = m.monthly;
  const vals = Array.from({length:12},(_,idx)=>base);
  const recurring = m.items.filter(i=>i._section!=="warranties");
  recurring.forEach(item=>{
    if ((item.monthly||0)>0 || !(item.annual>0)) return;
    const raw=item.next||"";
    const parts=raw.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (!parts) return;
    const month=Number(parts[2])-1;
    if (month>=0 && month<12) vals[month]+=item.annual;
  });
  const max=Math.max(...vals,1);
  const months=["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"];
  return `
    <div class="annual-bars">
      ${vals.map((v,i)=>`
        <div class="annual-bar-col">
          <div class="annual-bar-track"><div class="annual-bar-fill" style="height:${Math.max(6,(v/max)*100)}%"></div></div>
          <div class="annual-bar-value">${fmt(v)}</div>
          <div class="annual-bar-label">${months[i]}</div>
        </div>`).join("")}
    </div>`;
}


function displayItemType(item){
  if(item._section==="warranties") return "Compra";
  if(item._section==="insurance") return "Assegurança";
  if(item._section==="maintenance") return "Manteniment";
  if(item._section==="digital") return "Domini i digital";
  if(item._section==="subscriptions"){
    if((item.monthly||0)>0) return "Subscripció mensual";
    if((item.annual||0)>0) return "Subscripció anual";
    return "Subscripció";
  }
  return item._sectionLabel || "Element";
}

function itemSecondaryInfo(item){
  if(item._section==="warranties"){
    const bits=[];
    if(item.brand) bits.push(item.brand);
    if(item.model) bits.push(item.model);
    if(item.expiry) bits.push("Garantia fins "+item.expiry);
    return bits.join(" · ");
  }
  const bits=[];
  if(item.tag) bits.push(item.tag);
  if(item.next) bits.push("Proper: "+item.next);
  return bits.join(" · ");
}

function itemRightValue(item){
  if(item._section==="warranties") return item.amount ? fmt(item.amount) : "—";
  if((item.monthly||0)>0) return fmt(item.monthly)+"/mes";
  if((item.annual||0)>0) return fmt(item.annual)+"/any";
  return "—";
}


function tagUpcoming(tag){
  const items=getAllItemsForTag(tag).filter(i=>i.next || i.expiry);
  return items.slice(0,5);
}

function renderSectionBars(tag){
  const vals=allSections().map(s=>({label:s.label,value:sectionCostForTag(s.key,tag)}));
  const max=Math.max(...vals.map(x=>x.value),1);
  return `<div class="section-bars">${vals.map(x=>`
    <div class="section-bar-row">
      <div class="section-bar-meta"><span>${x.label}</span><strong>${fmt(x.value)}</strong></div>
      <div class="section-bar-track"><div class="section-bar-fill" style="width:${(x.value/max)*100}%"></div></div>
    </div>`).join("")}</div>`;
}

function tagDashboard(tag){
  const m = tagMetrics(tag);
  const upcoming = tagUpcoming(tag);
  const grouped = allSections().map(section=>({
    ...section,
    items:(data[section.key]||[]).filter(i=>itemHasTag(i,tag))
  })).filter(s=>s.items.length);

  const completeList = m.items.map(item=>`
    <button class="all-item-row" onclick="openTaggedItem('${item._section}',${JSON.stringify(item.name)},${JSON.stringify(item.id || "")})">
      <span class="all-item-main">
        <strong>${item.name}</strong>
        <small>${itemSecondaryInfo(item)}</small>
      </span>
      <span class="type-pill">${displayItemType(item)}</span>
      <span class="all-item-value">${itemRightValue(item)}</span>
    </button>
  `).join("");

  return `
    <div class="tag-dashboard-header tag-context-header">
      <div>
        
        <div class="eyebrow">Dashboard d’etiqueta</div>
        <h1>${tag}</h1>
        <div class="muted">Tot el que tens associat a ${tag}, independentment de la secció.</div>
      </div>
      
    </div>

    <div class="section-title"><h2>Visió ràpida</h2><span class="muted">Resum de ${tag}</span></div>
    <div class="grid metrics">
      ${metric("Total mensual", fmt(m.monthly), "Equivalent mensual")}
      ${metric("Total anual", fmt(m.annual), "Cost recurrent estimat")}
      ${metric("Aquest mes", fmt(m.thisMonth), "Pagaments previstos")}
      ${metric("Proper mes", fmt(m.nextMonthCost), "Pagaments previstos")}
    </div>

    <div class="dashboard-two-col">
      <div class="panel">
        <div class="panel-header"><div><h2>Properament</h2><div class="muted">Renovacions, pagaments, garanties i revisions</div></div></div>
        <div class="upcoming-list">
          ${upcoming.map(item=>`
            <button class="upcoming-row" onclick="openTaggedItem('${item._section}',${JSON.stringify(item.name)},${JSON.stringify(item.id || "")})">
              <span><strong>${item.name}</strong><small>${displayItemType(item)}</small></span>
              <span>${item.next || (item.expiry ? "Garantia: "+item.expiry : "—")}</span>
            </button>`).join("") || `<div class="empty-list">No hi ha res properament.</div>`}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><div><h2>Despesa anual per bloc</h2><div class="muted">Comparativa entre seccions</div></div></div>
        ${renderSectionBars(tag)}
      </div>
    </div>

    <div class="panel annual-panel">
      <div class="panel-header"><div><h2>Despesa anual per mesos</h2><div class="muted">Visió estimada segons periodicitat i renovacions</div></div></div>
      ${renderAnnualBars(tag)}
    </div>

    <div class="section-title complete-list-title"><h2>Tot ${tag}</h2><span class="muted">${m.items.length} elements</span></div>
    <div class="panel all-items-panel complete-list-panel">
      <div class="panel-header"><div><h2>Llistat complet</h2><div class="muted">Totes les coses que formen part de ${tag}, siguin del tipus que siguin.</div></div></div>
      <div class="all-items-list">${completeList || `<div class="empty-list">Encara no hi ha cap element amb l’etiqueta ${tag}.</div>`}</div>
    </div>

    <div class="list-add-row">
      <button class="secondary-btn list-add-btn" onclick="openAddModal(${JSON.stringify(tag)})">+ Afegir element a ${tag}</button>
    </div>

    <div class="section-title"><h2>Per categories</h2><span class="muted">Vista agrupada</span></div>
    <div class="tag-section-grid">
      ${grouped.map(section=>`
        <div class="panel tag-section-card">
          <div class="panel-header">
            <div><h2>${section.label}</h2><div class="muted">${section.items.length} elements</div></div>
            <strong>${section.key==="warranties" ? "" : fmt(sectionCostForTag(section.key,tag))+"/any"}</strong>
          </div>
          <div class="tag-item-list">
            ${section.items.map(item=>`
              <button class="tag-item-row" onclick="openTaggedItem('${section.key}',${JSON.stringify(item.name)},${JSON.stringify(item.id || "")})">
                <span><strong>${item.name}</strong><small>${item.tag || item.brand || ""}</small></span>
                <span>${section.key==="warranties" ? (item.amount ? fmt(item.amount) : "Veure") : itemRightValue({...item,_section:section.key})}</span>
              </button>`).join("")}
          </div>
        </div>`).join("") || `<div class="panel"><div class="muted">Encara no hi ha cap element amb aquesta etiqueta.</div></div>`}
    </div>
  `;
}
function openTagDashboard(tag){
  currentFilter = tag;

  // Les etiquetes són contextuals:
  // - al Dashboard obren el dashboard específic de l'etiqueta
  // - a Agenda només filtren l'agenda
  // - a la resta de seccions filtren la vista actual
  if (currentView === "dashboard") {
    tagDashboardOpen = tag !== "Tots";
  } else {
    tagDashboardOpen = false;
  }

  document.querySelectorAll(".filter-chip").forEach(b=>{
    b.classList.toggle("active", b.dataset.filter===tag);
  });
  render();
}

function closeTagDashboard(){
  tagDashboardOpen=false;
  currentFilter="Tots";
  document.querySelectorAll(".chip").forEach(b=>b.classList.toggle("active", b.dataset.filter==="Tots"));
  render();
}

function openTaggedItem(sectionKey, name, id){
  tagDashboardOpen=false;
  if(sectionKey==="warranties"){
    currentView="warranties";
    selectedWarrantyId=id;
    warrantyEditMode=false;
  } else {
    currentView=sectionKey;
    selectedRecurring={key:sectionKey,name};
    recurringEditMode=false;
  }
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.view===currentView));
  render();
}

function dashboard() {
  const recurring = allRecurring();
  const monthly = sumMonthly(recurring);
  const annual = sumAnnual(recurring);
  const warrantyCount = filtered(data.warranties).length;

  const categories = [
    ["Subscripcions", sumAnnual(data.subscriptions)],
    ["Assegurances", sumAnnual(data.insurance)],
    ["Manteniments", sumAnnual(data.maintenance)],
    ["Dominis i digital", sumAnnual(data.digital)]
  ];
  const max = Math.max(...categories.map(x=>x[1]),1);

  return `
    <div class="grid metrics">
      ${metric("Cost mensual equivalent", fmt(monthly), "Mitjana de totes les despeses recurrents")}
      ${metric("Cost anual", fmt(annual), "Estimació anual total")}
      ${metric("Aquest mes", fmt(monthly * .82), "Pagaments previstos aquest mes")}
      ${metric("Garanties actives", warrantyCount, "Elements registrats amb garantia")}
    </div>

    <div class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div><h2>Despesa anual per bloc</h2><div class="muted">Comparativa dels costos recurrents</div></div>
        </div>
        <div class="bar-list">
          ${categories.map(([name,val])=>`
            <div class="bar-row">
              <span>${name}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(val/max)*100}%"></div></div>
              <strong>${Math.round(val)} €</strong>
            </div>`).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><div><h2>Properament</h2><div class="muted">Renovacions i revisions</div></div></div>
        <div class="timeline">
          ${filtered([
            {d:"18",m:"SET",t:"Spotify",s:"Subscripció",a:"11,99 €"},
            {d:"04",m:"OCT",t:"ITV cotxe",s:"Manteniment",a:""},
            {d:"12",m:"OCT",t:"Aerotèrmia",s:"Revisió",a:"180 €"},
            {d:"23",m:"OCT",t:"Assegurança llar",s:"Renovació anual",a:"420 €"}
          ].map(x=>({...x,scope:x.t.includes("cotxe")?"Cotxe":x.t.includes("llar")||x.t.includes("Aerotèrmia")?"Casa":"Personal"}))).map(x=>`
            <div class="timeline-item">
              <div class="date-box">${x.m}<strong>${x.d}</strong></div>
              <div><div class="item-title">${x.t}</div><div class="item-sub">${x.s}</div></div>
              <div class="amount">${x.a}</div>
            </div>`).join("") || `<div class="muted">No hi ha venciments per aquest filtre.</div>`}
        </div>
      </div>
    </div>

    <div class="section-title"><h2>Visió ràpida</h2><span class="muted">Tots els blocs</span></div>
    <div class="category-grid">
      ${[
        ["Subscripcions", data.subscriptions, "subscripcions"],
        ["Assegurances", data.insurance, "pòlisses"],
        ["Manteniments", data.maintenance, "revisions"],
        ["Dominis i digital", data.digital, "serveis"]
      ].map(([title,items,label])=>`
        <div class="category-card">
          <div class="muted">${title}</div>
          <div class="big">${fmt(sumAnnual(items))}/any</div>
          <div class="muted">${filtered(items).length} ${label} · ${fmt(sumMonthly(items))}/mes</div>
        </div>`).join("")}
    </div>
  `;
}

function recurringView(title, items, noun, key) {
  if (selectedRecurring && selectedRecurring.key === key) {
    const item = data[key].find(x => x.name === selectedRecurring.name);
    if (item) return recurringDetailView(title, item, key);
    selectedRecurring = null;
  }

  const f = filtered(items);
  return `
    <div class="grid metrics">
      ${metric(`Cost mensual`, fmt(sumMonthly(items)), `Mitjana mensual equivalent`)}
      ${metric(`Cost anual`, fmt(sumAnnual(items)), `Estimació anual`)}
      ${metric(`Actius`, f.length, noun)}
      ${metric(`Proper pagament`, f[0]?.next || "—", f[0]?.name || "Sense elements")}
    </div>
    <div class="section-title"><h2>${title}</h2><span class="muted">${f.length} elements</span></div>
    <div class="panel">
      <table class="data-table">
        <thead><tr><th>Nom</th><th>Àmbit</th><th>Tipus</th><th>Periodicitat</th><th>Mensual</th><th>Anual</th><th>Proper</th><th>Accions</th></tr></thead>
        <tbody>
          ${f.map((x,idx)=>`<tr>
            <td><strong>${x.name}</strong></td>
            <td><div class="tag-cell">${tagChips(x)}</div></td>
            <td>${x.tag}</td>
            <td><span class="meta-chip meta-cadence">${inferFrequency(x,key)}</span></td>
            <td>${fmt(x.monthly)}</td>
            <td>${fmt(x.annual)}</td>
            <td>${x.next}</td>
            <td>
              <div class="table-actions">
                <button class="row-btn recurring-action" data-action="view" data-key="${key}" data-index="${data[key].indexOf(x)}">Veure</button>
                <button class="row-btn recurring-action" data-action="history" data-key="${key}" data-index="${data[key].indexOf(x)}">Historial</button>
                <button class="row-btn recurring-action" data-action="edit" data-key="${key}" data-index="${data[key].indexOf(x)}">Editar</button>
                <button class="danger-btn compact recurring-action" data-action="delete" data-key="${key}" data-index="${data[key].indexOf(x)}">Eliminar</button>
              </div>
            </td>
          </tr>`).join("") || `<tr><td colspan="8" class="muted">No hi ha elements amb aquest filtre.</td></tr>`}
        </tbody>
      </table>
      <div class="section-add-footer">
        <button class="secondary-btn" onclick="openAddForType('${key}', currentFilter === 'Tots' ? null : currentFilter)">+ Afegir ${title.toLowerCase()}</button>
      </div>
    </div>
  `;
}

function recurringDetailView(title, item, key) {
  if (recurringEditMode) {
    return `
      <div class="detail-toolbar">
        <button class="back-btn" onclick="closeRecurring()">← Tornar</button>
        <div class="detail-actions">
          <button class="danger-btn" onclick="deleteRecurring('${key}','${item.name.replace(/'/g,"\'")}')">Eliminar</button>
          <button class="secondary-btn" onclick="cancelRecurringEdit()">Cancel·lar</button>
          <button class="primary-btn" onclick="saveRecurringEdit('${key}','${item.name.replace(/'/g,"\'")}')">Desar canvis</button>
        </div>
      </div>

      <div class="detail-hero">
        <div>
          <div class="eyebrow">${title}</div>
          <h2>${item.name}</h2>
          <div class="detail-meta">${item.tag}</div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="panel">
          <div class="panel-header"><h2>Dades</h2></div>
          <div class="form-grid">
            ${fieldInput("Nom","r-name",item.name)}
            ${fieldSelect("Àmbit principal","r-scope",item.scope,["Personal","Professional","Casa","Cotxe","Mascotes","Salut"])}
            ${tagMultiSelect("r", item.tags || [item.scope])}
            ${key === "subscriptions" ? subscriptionTypeFields("r", item.tag) : fieldInput("Tipus","r-tag",item.tag)}
            ${fieldInput("Cost mensual","r-monthly",item.monthly,"number")}
            ${fieldInput("Cost anual","r-annual",item.annual,"number")}
            ${recurrenceFields("r",item,key)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><h2>Notes i configuració</h2></div>
          <textarea class="textarea" id="field-r-notes">${item.notes || ""}</textarea>
        </div>
      </div>
      <div class="panel simple-doc-panel">
        ${simpleDocumentsField("edit", currentGeneralDocs(item,key))}
      </div>
    `;
  }

  return `
    <div class="detail-toolbar">
      <button class="back-btn" onclick="closeRecurring()">← Tornar</button>
      <div class="detail-actions">
        <button class="secondary-btn" onclick="startRecurringEdit()">Editar</button>
        <button class="danger-btn" onclick="deleteRecurring('${key}','${item.name.replace(/'/g,"\'")}')">Eliminar</button>
      </div>
    </div>

    <div class="detail-hero">
      <div>
        <div class="eyebrow">${title}</div>
        <h2>${item.name}</h2>
        <div class="detail-meta">${item.tag}</div>
      </div>
      <div class="detail-price">${fmt(item.annual)}/any</div>
    </div>

    <div class="detail-grid">
      <div class="panel">
        <div class="panel-header"><h2>Resum</h2></div>
        <div class="info-grid">
          ${infoRow("Àmbit principal",`<span class="tag">${item.scope}</span>`)}
          ${infoRow("Etiquetes",tagChips(item))}
          ${infoRow("Tipus",item.tag)}
          ${infoRow("Cost mensual",fmt(item.monthly))}
          ${infoRow("Cost anual",fmt(item.annual))}
          ${infoRow("Periodicitat",inferFrequency(item,key))}
          ${item.startDate ? infoRow(referenceDateLabel(key),item.startDate) : ""}
          ${infoRow(nextDateLabel(key),item.next||"—")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><h2>Notes</h2></div>
        <div class="notes-box">${item.notes || "Sense notes."}</div>
      </div>
    </div>

    ${historyBlock(item,key)}
  `;
}

function openRecurring(key,name){ selectedRecurring={key,name}; recurringEditMode=false; render(); }
function editRecurringFromList(key,name){ pendingEditDocs=[]; selectedRecurring={key,name}; recurringEditMode=true; render(); setTimeout(()=>bindRecurrenceFields("r",key),0); }

function closeRecurring(){ selectedRecurring=null; recurringEditMode=false; render(); }
function startRecurringEdit(){ pendingEditDocs=[]; recurringEditMode=true; render(); setTimeout(()=>bindRecurrenceFields("r",selectedRecurring?.key||currentView),0); }
function cancelRecurringEdit(){ recurringEditMode=false; render(); }

function saveRecurringEdit(key, oldName){
  const item = data[key].find(x=>x.name===oldName);
  if (!item) return;
  const before={...item,tags:[...(item.tags||[])]};

  const draft={...item};
  draft.name = document.querySelector("#field-r-name")?.value || item.name;
  draft.tag = key==="subscriptions" ? getSubscriptionTypeValue("r") : (document.querySelector("#field-r-tag")?.value || item.tag);
  draft.monthly = Number((document.querySelector("#field-r-monthly")?.value || item.monthly || 0).toString().replace(",","."));
  draft.annual = Number((document.querySelector("#field-r-annual")?.value || item.annual || 0).toString().replace(",","."));
  const recurrence=getRecurrenceData("r",key,item.next||"—");
  draft.startDate=recurrence.startDate;
  draft.frequency=recurrence.frequency;
  draft.next=recurrence.next;
  draft.scope = document.querySelector("#field-r-scope")?.value || item.scope;
  draft.tags = Array.from(new Set([draft.scope, ...getSelectedTags("r")].filter(Boolean)));
  draft.notes = document.querySelector("#field-r-notes")?.value || "";

  const details=recurringDiffs(draft,key,before);
  const newDocs=[...pendingEditDocs];

  if(!details.length && !newDocs.length){
    recurringEditMode=false;
    render();
    return;
  }

  const applyDraft=()=>{
    Object.assign(item,draft);
    selectedRecurring={key,name:item.name};
  };
  const rollback=()=>{
    // no data has been committed yet; simply stay in edit mode
    recurringEditMode=true;
    render();
  };

  showSaveDecision({
    key,details,newDocs,rollback,
    commit:(mode)=>{
      applyDraft();
      if(mode==="change"){
        registerRecurringChanges(item,key,before,newDocs);
      }else if(newDocs.length){
        // In a correction, new docs belong to the initial/current record without creating a new history event.
        const hist=ensureHistory(item,key);
        const target=hist[hist.length-1] || hist[0];
        target.documents=target.documents||[];
        target.documents.push(...newDocs);
      }
      pendingEditDocs=[];
      saveLifeHubState?.();
      recurringEditMode=false;
      render();
    }
  });
}

function deleteRecurring(key,name){
  if (!confirm("Segur que vols eliminar aquest element? Aquesta acció no es pot desfer.")) return;
  const idx = data[key].findIndex(x=>x.name===name);
  if (idx>=0) data[key].splice(idx,1);
  selectedRecurring=null;
  recurringEditMode=false;
  render();
}

function warrantiesView() {
  const f = filtered(data.warranties);
  const total = f.reduce((a,b)=>a+b.amount,0);

  if (selectedWarrantyId) {
    const item = data.warranties.find(x=>x.id===selectedWarrantyId);
    if (!item) selectedWarrantyId = null;
    else return warrantyDetailView(item);
  }

  return `
    <div class="grid metrics">
      ${metric("Valor registrat", fmt(total), "Import de les compres")}
      ${metric("Garanties actives", f.length, "Elements protegits")}
      ${metric("Caduquen aviat", f.filter((_,i)=>i===1).length, "En els propers mesos")}
      ${metric("Documents", f.reduce((a,b)=>a+ensureHistory(b,"warranties").reduce((s,h)=>s+(h.documents||[]).length,0),0), "Vinculats a compres i canvis")}
    </div>
    <div class="section-title"><h2>Compres i garanties</h2><span class="muted">${f.length} elements</span></div>
    <div class="panel">
      <table class="data-table">
        <thead><tr><th>Producte</th><th>Àmbit</th><th>Botiga</th><th>Import</th><th>Garantia fins</th><th>Documents</th><th></th></tr></thead>
        <tbody>
          ${f.map((x,i)=>`<tr>
            <td><strong>${x.name}</strong><div class="item-sub">${x.brand} · ${x.model}</div></td>
            <td><div class="tag-cell">${tagChips(x)}</div></td>
            <td>${x.seller}</td>
            <td>${fmt(x.amount)}</td>
            <td>${x.expiry}</td>
            <td>${ensureHistory(x,"warranties").reduce((s,h)=>s+(h.documents||[]).length,0)} arx.</td>
            <td>
              <div class="table-actions">
                <button class="row-btn" onclick="openWarranty('${x.id}')">Veure</button>
                <button class="row-btn" onclick="openWarrantyHistory('${x.id}')">Historial</button>
                <button class="row-btn" onclick="editWarrantyFromList('${x.id}')">Editar</button>
                <button class="danger-btn compact" onclick="deleteWarranty('${x.id}')">Eliminar</button>
              </div>
            </td>
          </tr>`).join("") || `<tr><td colspan="7" class="muted">No hi ha elements.</td></tr>`}
        </tbody>
      </table>
      <div class="section-add-footer">
        <button class="secondary-btn" onclick="openAddForType('warranties', currentFilter === 'Tots' ? null : currentFilter)">+ Afegir compra o garantia</button>
      </div>
    </div>
  `;
}

function warrantyDetailView(item) {
  if (warrantyEditMode) {
    return `
      <div class="detail-toolbar">
        <button class="back-btn" onclick="closeWarranty()">← Tornar</button>
        <div class="detail-actions">
          <button class="danger-btn" onclick="deleteWarranty('${item.id}')">Eliminar</button>
          <button class="secondary-btn" onclick="cancelWarrantyEdit()">Cancel·lar</button>
          <button class="primary-btn" onclick="saveWarrantyEdit('${item.id}')">Desar canvis</button>
        </div>
      </div>

      <div class="detail-hero">
        <div>
          <div class="eyebrow">Editant compra</div>
          <h2>${item.name}</h2>
          <div class="detail-meta">${item.brand} · ${item.model}</div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="panel">
          <div class="panel-header"><h2>Dades de compra</h2></div>
          <div class="form-grid">
            ${fieldInput("Producte","name",item.name)}
            ${fieldInput("Marca","brand",item.brand)}
            ${fieldInput("Model","model",item.model)}
            ${fieldInput("Preu","amount",item.amount,"number")}
            ${fieldInput("Data de compra","purchaseDate",item.purchaseDate)}
            ${fieldInput("Garantia fins","expiry",item.expiry)}
            ${fieldSelect("Àmbit principal","scope",item.scope,["Personal","Professional","Casa","Cotxe","Mascotes","Salut"])}
            ${tagMultiSelect("w", item.tags || [item.scope])}
            ${fieldInput("Categoria","tag",item.tag)}
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><h2>Botiga i contacte</h2></div>
          <div class="form-grid">
            ${fieldSelect("Tipus de compra","purchaseType",item.purchaseType,["Online","Botiga física"])}
            ${fieldInput("Botiga / web","seller",item.seller)}
            ${fieldInput("Web","website",item.website)}
            ${fieldInput("Adreça","address",item.address)}
            ${fieldInput("Email de contacte","sellerEmail",item.sellerEmail,"email")}
            ${fieldInput("Email utilitzat per comprar","purchaseEmail",item.purchaseEmail,"email")}
            ${fieldInput("Núm. comanda / factura","orderNumber",item.orderNumber)}
          </div>
        </div>

        <div class="panel detail-full">
          <div class="panel-header"><h2>Notes</h2></div>
          <textarea class="textarea" id="field-notes">${item.notes || ""}</textarea>
        </div>
      </div>

    `;
  }

  return `
    <div class="detail-toolbar">
      <button class="back-btn" onclick="closeWarranty()">← Tornar</button>
      <div class="detail-actions">
        <button class="secondary-btn" onclick="startWarrantyEdit()">Editar</button>
        <button class="danger-btn" onclick="deleteWarranty('${item.id}')">Eliminar</button>
      </div>
    </div>

    <div class="detail-hero">
      <div>
        <div class="eyebrow">Compra i garantia</div>
        <h2>${item.name}</h2>
        <div class="detail-meta">${item.brand} · ${item.model}</div>
      </div>
      <div class="detail-price">${fmt(item.amount)}</div>
    </div>

    <div class="detail-grid">
      <div class="panel">
        <div class="panel-header"><h2>Dades de compra</h2></div>
        <div class="info-grid">
          ${infoRow("Data de compra",item.purchaseDate)}
          ${infoRow("Garantia fins",item.expiry)}
          ${infoRow("Àmbit principal",`<span class="tag">${item.scope}</span>`)}
          ${infoRow("Etiquetes",tagChips(item))}
          ${infoRow("Categoria",item.tag)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Botiga i contacte</h2></div>
        <div class="info-grid">
          ${infoRow("Tipus",item.purchaseType)}
          ${infoRow("Botiga",item.seller)}
          ${infoRow("Web",item.website || "—")}
          ${infoRow("Adreça",item.address || "—")}
          ${infoRow("Email botiga",item.sellerEmail || "—")}
          ${infoRow("Email utilitzat",item.purchaseEmail || "—")}
          ${infoRow("Núm. comanda",item.orderNumber || "—")}
        </div>
      </div>

      <div class="panel detail-full">
        <div class="panel-header"><h2>Notes</h2></div>
        <div class="notes-box">${item.notes || "Sense notes."}</div>
      </div>
    </div>

    ${historyBlock(item,"warranties")}
  `;
}

function documentsBlock(item){
  return `
    <div class="section-title"><h2>Documents</h2><span class="muted">${item.documents.length} arxius</span></div>
    <div class="panel">
      <div class="documents-list">
        ${item.documents.map((d,i)=>`
          <div class="document-row">
            <div>
              <strong>📄 ${d.name}</strong>
              <div class="item-sub">${d.type}</div>
            </div>
            <div class="doc-actions">
              <button class="icon-action" title="Vista prèvia" onclick="previewWarrantyDocument('${item.id}',${i})"><svg class="flat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
        <circle cx="12" cy="12" r="2.75"></circle>
      </svg></button>
              <button class="icon-action" title="Descarregar" onclick="downloadWarrantyDocument('${item.id}',${i})">↓</button>
              <button class="row-btn" onclick="editWarrantyDocument('${item.id}',${i})">Editar</button>
              <label class="row-btn upload-label">Substituir
                <input type="file" hidden onchange="replaceWarrantyDocument(event,'${item.id}',${i})">
              </label>
              <button class="danger-btn compact" onclick="removeWarrantyDocument('${item.id}',${i})">Eliminar</button>
            </div>
          </div>`).join("") || `<div class="muted">Encara no hi ha documents.</div>`}
      </div>
      <label class="upload-drop">＋ Pujar factura, ticket, garantia o altre document
        <input type="file" hidden onchange="uploadWarrantyDocument(event,'${item.id}')">
      </label>
      <div class="muted upload-note">En aquest prototip el fitxer només es mostra a la sessió; encara no es desa en un servidor.</div>
    </div>
  `;
}

function infoRow(label,value){
  return `<div class="info-row"><span>${label}</span><strong>${value}</strong></div>`;
}
function fieldInput(label,key,value,type="text"){
  return `<label class="field"><span>${label}</span><input id="field-${key}" type="${type}" value="${String(value ?? "").replace(/"/g,"&quot;")}"></label>`;
}

const subscriptionTypeOptions = [
  "Oci",
  "Salut",
  "Software",
  "Productivitat",
  "Emmagatzematge",
  "Comunicació",
  "Formació",
  "Finances",
  "Mobilitat",
  "Llar",
  "Esport",
  "Benestar",
  "Premsa i continguts",
  "Seguretat",
  "Altres"
];

function subscriptionTypeFields(prefix, currentValue=""){
  const known = subscriptionTypeOptions.includes(currentValue) && currentValue !== "Altres";
  const selected = known ? currentValue : (currentValue ? "Altres" : "Software");
  const manualValue = known ? "" : currentValue;
  return `
    ${fieldSelect("Tipus / categoria", `${prefix}-tag-select`, selected, subscriptionTypeOptions)}
    <label class="field subscription-custom-type" id="${prefix}-tag-custom-wrap" style="${selected==="Altres" ? "" : "display:none;"}">
      <span>Tipus personalitzat</span>
      <input id="field-${prefix}-tag-custom" type="text" value="${String(manualValue ?? "").replace(/"/g,"&quot;")}" placeholder="Escriu el tipus...">
    </label>
  `;
}

function bindSubscriptionTypeToggle(prefix){
  const select = document.querySelector(`#field-${prefix}-tag-select`);
  const wrap = document.querySelector(`#${prefix}-tag-custom-wrap`);
  if (!select || !wrap) return;
  const sync = ()=>{ wrap.style.display = select.value === "Altres" ? "" : "none"; };
  select.addEventListener("change", sync);
  sync();
}

function getSubscriptionTypeValue(prefix){
  const selected = document.querySelector(`#field-${prefix}-tag-select`)?.value || "";
  if (selected === "Altres") {
    return document.querySelector(`#field-${prefix}-tag-custom`)?.value.trim() || "Altres";
  }
  return selected;
}


const recurrenceOptions=["Mensual","Trimestral","Semestral","Anual","Biennal","Sense renovació"];

function defaultFrequencyFor(key){
  return key==="subscriptions" ? "Mensual" : key==="insurance" ? "Anual" : key==="maintenance" ? "Anual" : key==="digital" ? "Anual" : "Anual";
}
function referenceDateLabel(key){
  return key==="subscriptions" ? "Data d'alta / últim cobrament" :
         key==="insurance" ? "Data d'alta / última renovació" :
         key==="maintenance" ? "Data de l'últim manteniment" :
         key==="digital" ? "Data de registre / última renovació" :
         "Data de referència";
}
function nextDateLabel(key){
  return key==="subscriptions" ? "Proper cobrament" :
         key==="insurance" ? "Propera renovació" :
         key==="maintenance" ? "Proper manteniment" :
         key==="digital" ? "Propera renovació" : "Proper";
}
function inferFrequency(item,key){
  if(item?.frequency) return item.frequency;
  if(key==="warranties") return "Sense renovació";
  if(Number(item?.monthly||0)>0 && Number(item?.annual||0)>0){
    const ratio=Number(item.annual)/Number(item.monthly);
    if(ratio>10 && ratio<14) return "Mensual";
  }
  return defaultFrequencyFor(key);
}
function frequencyMonths(freq){
  return ({Mensual:1,Trimestral:3,Semestral:6,Anual:12,Biennal:24})[freq] || 0;
}
function parseIsoDate(value){
  if(!value) return null;
  const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return null;
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
}
function addMonthsSafe(date,months){
  const d=new Date(date.getTime());
  const day=d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth()+months);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(day,last));
  return d;
}
function formatCatalanDate(date){
  if(!(date instanceof Date) || isNaN(date)) return "—";
  const months=["GEN","FEB","MAR","ABR","MAI","JUN","JUL","AGO","SET","OCT","NOV","DES"];
  return `${String(date.getDate()).padStart(2,"0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
function calculateNextRenewal(referenceIso,frequency){
  const base=parseIsoDate(referenceIso);
  const months=frequencyMonths(frequency);
  if(!base || !months) return "—";
  const today=new Date();
  today.setHours(0,0,0,0);
  let next=addMonthsSafe(base,months);
  let guard=0;
  while(next<=today && guard<600){
    next=addMonthsSafe(next,months);
    guard++;
  }
  return formatCatalanDate(next);
}
function recurrenceFields(prefix,item,key){
  const frequency=inferFrequency(item||{},key);
  const startDate=item?.startDate||"";
  const next=startDate ? calculateNextRenewal(startDate,frequency) : (item?.next||"—");
  return `
    ${fieldInput(referenceDateLabel(key),`${prefix}-startDate`,startDate,"date")}
    ${fieldSelect("Periodicitat",`${prefix}-frequency`,frequency,recurrenceOptions)}
    <label class="field recurrence-preview-field">
      <span>${nextDateLabel(key)}</span>
      <input id="field-${prefix}-next-preview" value="${next}" readonly>
      <small>Es calcula automàticament segons la data i la periodicitat.</small>
    </label>`;
}
function syncRecurrencePreview(prefix,key){
  const date=document.querySelector(`#field-${prefix}-startDate`)?.value||"";
  const frequency=document.querySelector(`#field-${prefix}-frequency`)?.value||defaultFrequencyFor(key);
  const preview=document.querySelector(`#field-${prefix}-next-preview`);
  if(preview) preview.value=date ? calculateNextRenewal(date,frequency) : "—";
}
function bindRecurrenceFields(prefix,key){
  const date=document.querySelector(`#field-${prefix}-startDate`);
  const frequency=document.querySelector(`#field-${prefix}-frequency`);
  [date,frequency].forEach(el=>el?.addEventListener("change",()=>syncRecurrencePreview(prefix,key)));
}
function getRecurrenceData(prefix,key,fallbackNext="—"){
  const startDate=document.querySelector(`#field-${prefix}-startDate`)?.value||"";
  const frequency=document.querySelector(`#field-${prefix}-frequency`)?.value||defaultFrequencyFor(key);
  const next=startDate ? calculateNextRenewal(startDate,frequency) : fallbackNext;
  return {startDate,frequency,next};
}

function fieldSelect(label,key,value,options){
  return `<label class="field"><span>${label}</span><select id="field-${key}">${options.map(o=>`<option ${o===value?"selected":""}>${o}</option>`).join("")}</select></label>`;
}

function tagMultiSelect(prefix, selectedTags=[]){
  const selected = Array.isArray(selectedTags) ? selectedTags : [];
  return `<div class="field field-wide tag-field"><span>Etiquetes</span>
    <div class="tag-picker" id="tag-picker-${prefix}">
      ${allAvailableTags().map(tag=>`<label class="tag-option ${selected.includes(tag)?"selected":""}">
        <input type="checkbox" value="${String(tag).replace(/"/g,"&quot;")}" ${selected.includes(tag)?"checked":""} onchange="this.closest('.tag-option').classList.toggle('selected',this.checked)">
        <span>${tag}</span>
      </label>`).join("")}
    </div>
    <div class="field-help">Pots assignar-ne diverses al mateix element.</div>
  </div>`;
}
function getSelectedTags(prefix){
  return Array.from(document.querySelectorAll(`#tag-picker-${prefix} input:checked`)).map(el=>el.value);
}

function sectionLabel(key){
  return ({
    subscriptions:"Subscripció",
    warranties:"Compra / garantia",
    insurance:"Assegurança",
    maintenance:"Manteniment",
    digital:"Domini i digital"
  })[key] || key;
}
function cadenceLabel(item,key){
  if(key==="warranties") return "Pagament únic";
  if(key==="maintenance" && !item?.frequency) return "Per intervenció";
  return inferFrequency(item,key);
}
function metaChips(item,key){
  return `<span class="meta-chip meta-type">${sectionLabel(key)}</span><span class="meta-chip meta-cadence">${cadenceLabel(item,key)}</span>`;
}

function tagChips(item){
  const tags=(Array.isArray(item.tags)&&item.tags.length?item.tags:[item.scope]).filter(Boolean);
  return tags.map(t=>`<span class="tag">${t}</span>`).join(" ");
}
function historyDateToday(){
  return "12 SET 2026";
}
function docTypeFromName(name=""){
  const lower=name.toLowerCase();
  return lower.includes("factura") ? "Factura" :
         lower.includes("ticket") || lower.includes("tiquet") ? "Tiquet" :
         lower.includes("garantia") ? "Garantia" :
         lower.includes("contract") ? "Contracte" :
         lower.includes("polissa") || lower.includes("pòlissa") ? "Pòlissa" :
         lower.includes("informe") ? "Informe" : "Document";
}
function ensureHistory(item,key){
  if(!Array.isArray(item.history)) item.history=[];
  item.history=item.history.map(h=>({
    date:h.date||historyDateToday(),
    title:h.title||h.text||"Actualització",
    text:h.text && !h.title ? "" : (h.text||""),
    type:h.type||"event",
    amount:typeof h.amount==="number" ? h.amount : null,
    details:Array.isArray(h.details)?h.details:[],
    documents:Array.isArray(h.documents)?h.documents:[],
  }));
  if(item.history.length===0){
    item.history.push({
      date:key==="warranties"?(item.purchaseDate||historyDateToday()):historyDateToday(),
      title:key==="warranties"?"Compra registrada":"Element afegit",
      text:key==="warranties"?`${item.name} · ${fmt(item.amount||0)}`:"",
      type:"created",
      amount:key==="warranties" ? Number(item.amount||0) : null,
      details:[],
      documents:[]
    });
  }
  // Migra documents antics a l'entrada inicial perquè quedin vinculats al fet que els origina.
  if(Array.isArray(item.documents) && item.documents.length){
    const first=item.history[0];
    first.documents=first.documents||[];
    item.documents.forEach(d=>{
      if(!first.documents.some(x=>x.name===d.name)) first.documents.push({name:d.name,type:d.type||docTypeFromName(d.name),url:d.url||""});
    });
    item.documents=[];
  }
  return item.history;
}
function historySummary(item,key,hist){
  const valued=hist.filter(h=>typeof h.amount==="number" && h.amount>0);
  if(key==="maintenance" && valued.length){
    const total=valued.reduce((s,h)=>s+h.amount,0);
    return `<div class="history-summary">
      <div><span>Total registrat</span><strong>${fmt(total)}</strong></div>
      <div><span>Mitjana per intervenció</span><strong>${fmt(total/valued.length)}</strong></div>
      <div><span>Intervencions</span><strong>${valued.length}</strong></div>
    </div>`;
  }
  if(key==="subscriptions"){
    return `<div class="history-summary"><div><span>Preu actual</span><strong>${fmt(item.monthly)}/mes</strong></div><div><span>Moviments</span><strong>${hist.length}</strong></div></div>`;
  }
  return "";
}
function historyEntryDocs(item,key,entry,index){
  if(!(entry.documents||[]).length) return "";
  return `<div class="history-docs">${entry.documents.map(d=>`<span class="history-doc">📎 ${d.name}</span>`).join("")}</div>`;
}

function escHtml(value=""){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
let editingHistoryContext=null;

function getHistoryItem(key,ref){
  return key==="warranties"
    ? data.warranties.find(x=>String(x.id)===String(ref))
    : (data[key]||[]).find(x=>x.name===ref);
}

function openHistoryEditor(key,ref,index){
  const item=getHistoryItem(key,ref);
  if(!item) return;
  const hist=ensureHistory(item,key);
  const entry=hist[index];
  if(!entry) return;
  editingHistoryContext={key,ref,index};
  const detailRows=(entry.details||[]).map((d,i)=>`
    <div class="history-edit-detail">
      <label>${escHtml(d.label||"Canvi")}</label>
      <div class="history-edit-detail-grid">
        <input id="history-detail-from-${i}" value="${escHtml(d.from||"")}" placeholder="Abans">
        <span>→</span>
        <input id="history-detail-to-${i}" value="${escHtml(d.to||"")}" placeholder="Després">
      </div>
    </div>`).join("");
  const docs=(entry.documents||[]).map((d,i)=>`
    <span class="simple-doc-chip">📎 ${escHtml(d.name)}
      <button type="button" onclick="removeHistoryEditorDocument(${i})">×</button>
    </span>`).join("");

  document.querySelector("#history-editor-root")?.remove();
  const root=document.createElement("div");
  root.id="history-editor-root";
  root.innerHTML=`<div class="history-editor-overlay">
    <div class="history-editor-card">
      <button class="save-decision-close" onclick="closeHistoryEditor()">×</button>
      <div class="eyebrow">Corregir registre</div>
      <h2>Editar historial</h2>
      <p>Això només corregeix aquest registre. No crea una entrada nova a l'historial.</p>
      <div class="history-editor-grid">
        <label>Data<input id="history-edit-date" value="${escHtml(entry.date||"")}"></label>
        <label>Títol<input id="history-edit-title" value="${escHtml(entry.title||"")}"></label>
        <label>Import (€)<input id="history-edit-amount" type="number" step="0.01" value="${entry.amount??""}"></label>
        <label class="field-wide">Notes<textarea id="history-edit-text">${escHtml(entry.text||"")}</textarea></label>
      </div>
      ${detailRows?`<div class="history-editor-details"><div class="field-caption">Canvis registrats</div>${detailRows}</div>`:""}
      <div class="history-editor-documents">
        <div class="field-caption">Documents d'aquest registre</div>
        <div id="history-editor-doc-list" class="simple-doc-list">${docs||'<span class="muted">Cap document</span>'}</div>
        <label class="simple-upload-btn">+ Afegir document
          <input type="file" hidden multiple onchange="addHistoryEditorDocuments(event)">
        </label>
      </div>
      <div class="history-editor-actions">
        <button class="secondary-btn" onclick="closeHistoryEditor()">Cancel·lar</button>
        <button class="primary-btn history-editor-save" onclick="saveHistoryEditor()">Desar correcció</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(root);
}

function historyEditorEntry(){
  if(!editingHistoryContext) return null;
  const {key,ref,index}=editingHistoryContext;
  const item=getHistoryItem(key,ref);
  return item ? ensureHistory(item,key)[index] : null;
}

function addHistoryEditorDocuments(event){
  const entry=historyEditorEntry();
  if(!entry) return;
  entry.documents=entry.documents||[];
  entry.documents.push(...Array.from(event.target.files||[]).map(f=>({name:f.name,type:docTypeFromName(f.name)})));
  // Reopen editor to refresh doc chips, but do not persist until Save.
  const c={...editingHistoryContext};
  openHistoryEditor(c.key,c.ref,c.index);
}

function removeHistoryEditorDocument(docIndex){
  const entry=historyEditorEntry();
  if(!entry) return;
  entry.documents=entry.documents||[];
  entry.documents.splice(docIndex,1);
  const c={...editingHistoryContext};
  openHistoryEditor(c.key,c.ref,c.index);
}

function saveHistoryEditor(){
  const c=editingHistoryContext;
  const entry=historyEditorEntry();
  if(!c || !entry) return;
  entry.date=document.querySelector("#history-edit-date")?.value||entry.date;
  entry.title=document.querySelector("#history-edit-title")?.value||entry.title;
  const amountRaw=document.querySelector("#history-edit-amount")?.value;
  entry.amount=amountRaw===""||amountRaw==null ? null : Number(String(amountRaw).replace(",","."));
  entry.text=document.querySelector("#history-edit-text")?.value||"";
  (entry.details||[]).forEach((d,i)=>{
    d.from=document.querySelector(`#history-detail-from-${i}`)?.value||"";
    d.to=document.querySelector(`#history-detail-to-${i}`)?.value||"";
  });
  saveLifeHubState?.();
  closeHistoryEditor();
  render();
}

function closeHistoryEditor(){
  editingHistoryContext=null;
  document.querySelector("#history-editor-root")?.remove();
}

function deleteHistoryEntry(key,ref,index){
  const item=getHistoryItem(key,ref);
  if(!item) return;
  const hist=ensureHistory(item,key);
  const entry=hist[index];
  if(!entry) return;
  const isInitial=entry.type==="created" && hist.length===1;
  if(isInitial){
    alert("El registre inicial no es pot eliminar perquè és l'origen de la fitxa. Pots editar-lo si hi ha alguna dada incorrecta.");
    return;
  }
  if(!confirm(`Eliminar “${entry.title}” de l'historial? Aquesta acció no canviarà les dades actuals de la fitxa.`)) return;
  hist.splice(index,1);
  saveLifeHubState?.();
  render();
}

function historyBlock(item,key){
  const hist=ensureHistory(item,key);
  const itemRef=key==="warranties"?item.id:item.name;
  const cta=key==="maintenance" ? `<button class="secondary-btn compact" onclick="addHistoryEntry('${key}','${String(itemRef).replace(/'/g,"\\'")}')">+ Registrar manteniment</button>` : "";
  const rows=hist.map((h,index)=>({h,index})).reverse().map(({h,index})=>`
    <div class="timeline-row history-event">
      <span class="timeline-dot"></span>
      <div class="history-event-body">
        <div class="history-event-top">
          <div><strong>${h.title}</strong><div class="item-sub">${h.date||"Sense data"}</div></div>
          <div class="history-event-right">
            ${typeof h.amount==="number" && h.amount>0 ? `<strong class="history-amount">${fmt(h.amount)}</strong>`:""}
            <div class="history-entry-actions">
              <button type="button" onclick="openHistoryEditor('${key}','${String(itemRef).replace(/'/g,"\\'")}',${index})">Editar</button>
              ${h.type==="created" ? "" : `<button type="button" class="history-delete" onclick="deleteHistoryEntry('${key}','${String(itemRef).replace(/'/g,"\\'")}',${index})">Eliminar</button>`}
            </div>
          </div>
        </div>
        ${h.text?`<div class="history-text">${h.text}</div>`:""}
        ${(h.details||[]).length?`<div class="change-list">${h.details.map(d=>`<div><span>${d.label}</span><strong>${d.from ? `${d.from} → `:""}${d.to||""}</strong></div>`).join("")}</div>`:""}
        ${historyEntryDocs(item,key,h,index)}
      </div>
    </div>`).join("");
  return `<div class="section-title history-title" id="element-history">
      <div><div class="eyebrow">Evolució de l'element</div><h2>Historial</h2></div>
      ${cta}
    </div>
    ${historySummary(item,key,hist)}
    <div class="panel history-panel">
      <div class="timeline">${rows}</div>
    </div>`;
}
function addHistoryEntry(key,ref){
  const item=key==="warranties" ? data.warranties.find(x=>String(x.id)===String(ref)) : (data[key]||[]).find(x=>x.name===ref);
  if(!item) return;
  let title="", text="", amount=null, details=[];
  const date=prompt("Data (p. ex. 12 SET 2026)",historyDateToday()) || historyDateToday();

  if(key==="maintenance"){
    title=prompt("Quin manteniment s'ha fet?","Revisió / manteniment")||"Manteniment";
    const cost=prompt("Quant t'han cobrat? (€)","");
    amount=cost!==null && cost!=="" ? Number(String(cost).replace(",",".")) : null;
    const provider=prompt("Taller / proveïdor (opcional)","")||"";
    const km=prompt("Km o hores d'ús (opcional)","")||"";
    text=prompt("Treballs realitzats / notes (opcional)","")||"";
    if(provider) details.push({label:"Proveïdor",to:provider});
    if(km) details.push({label:"Km / hores",to:km});
  }else if(key==="subscriptions"){
    title=prompt("Tipus de moviment","Renovació / canvi de pla")||"Moviment";
    text=prompt("Notes (opcional)","")||"";
    const cost=prompt("Import d'aquest moviment, si n'hi ha (€)","");
    amount=cost!==null && cost!=="" ? Number(String(cost).replace(",",".")) : null;
  }else if(key==="insurance"){
    title=prompt("Tipus de moviment","Renovació anual")||"Renovació";
    const cost=prompt("Prima / import (€)","");
    amount=cost!==null && cost!=="" ? Number(String(cost).replace(",",".")) : null;
    text=prompt("Canvis de cobertura o notes (opcional)","")||"";
  }else if(key==="digital"){
    title=prompt("Tipus de moviment","Renovació")||"Renovació";
    const cost=prompt("Import (€)","");
    amount=cost!==null && cost!=="" ? Number(String(cost).replace(",",".")) : null;
    text=prompt("Notes (opcional)","")||"";
  }else{
    title=prompt("Què ha passat?","Actualització")||"Actualització";
    text=prompt("Notes (opcional)","")||"";
    const cost=prompt("Import, si n'hi ha (€)","");
    amount=cost!==null && cost!=="" ? Number(String(cost).replace(",",".")) : null;
  }
  const entry={date,title,text,type:"manual",amount:Number.isFinite(amount)?amount:null,details,documents:[]};
  ensureHistory(item,key).push(entry);
  if(key==="maintenance"){
    const input=document.createElement("input"); input.type="file"; input.multiple=true; input.style.display="none";
    input.onchange=()=>{entry.documents=Array.from(input.files||[]).map(f=>({name:f.name,type:docTypeFromName(f.name)})); saveLifeHubState?.(); render(); input.remove();};
    document.body.appendChild(input);
    if(confirm("Vols adjuntar la factura o l'informe d'aquest manteniment?")){input.click(); return;}
    input.remove();
  }
  saveLifeHubState?.();
  render();
}
function uploadHistoryDocument(event,key,ref,historyIndex){
  const file=event.target.files?.[0]; if(!file)return;
  const item=key==="warranties" ? data.warranties.find(x=>String(x.id)===String(ref)) : (data[key]||[]).find(x=>x.name===ref);
  if(!item)return;
  const hist=ensureHistory(item,key);
  if(!hist[historyIndex])return;
  hist[historyIndex].documents=hist[historyIndex].documents||[];
  hist[historyIndex].documents.push({name:file.name,type:docTypeFromName(file.name)});
  saveLifeHubState?.();
  render();
}
function removeHistoryDocument(key,ref,historyIndex,docIndex){
  const item=key==="warranties" ? data.warranties.find(x=>String(x.id)===String(ref)) : (data[key]||[]).find(x=>x.name===ref);
  if(!item)return;
  const hist=ensureHistory(item,key);
  const doc=hist[historyIndex]?.documents?.[docIndex];
  if(!doc || !confirm(`Eliminar ${doc.name}?`))return;
  hist[historyIndex].documents.splice(docIndex,1);
  saveLifeHubState?.();
  render();
}
function changeDetail(label,from,to,isMoney=false){
  const f=isMoney?fmt(Number(from||0)):String(from??"");
  const t=isMoney?fmt(Number(to||0)):String(to??"");
  if(f===t)return null;
  return {label,from:f,to:t};
}
function registerRecurringChanges(item,key,before,newDocs=[]){
  const details=recurringDiffs(item,key,before);
  if(!details.length && !newDocs.length)return;
  const priceChanged=details.some(d=>d.label==="Cost mensual"||d.label==="Cost anual");
  const planChanged=details.some(d=>d.label==="Pla / categoria");
  const title=priceChanged ? "Canvi de preu" : planChanged ? "Canvi de pla" : details.length ? "Dades actualitzades" : "Documentació actualitzada";
  ensureHistory(item,key).push({date:historyDateToday(),title,type:"automatic",amount:null,details,documents:[...newDocs]});
}
function registerWarrantyChanges(item,before,newDocs=[]){
  const details=warrantyDiffs(item,before);
  if(!details.length && !newDocs.length)return;
  const title=details.some(d=>d.label==="Preu")?"Canvi de preu / cost":details.length?"Compra o garantia actualitzada":"Documentació actualitzada";
  ensureHistory(item,"warranties").push({date:historyDateToday(),title,type:"automatic",amount:null,details,documents:[...newDocs]});
}
function openWarranty(id){ selectedWarrantyId=id; warrantyEditMode=false; render(); }
function openWarrantyHistory(id){
  selectedWarrantyId=id; warrantyEditMode=false; render();
  requestAnimationFrame(()=>document.querySelector("#element-history")?.scrollIntoView({behavior:"smooth",block:"start"}));
}
function editWarrantyFromList(id){ pendingEditDocs=[]; selectedWarrantyId=id; warrantyEditMode=true; render(); }

function closeWarranty(){ selectedWarrantyId=null; warrantyEditMode=false; render(); }
function startWarrantyEdit(){ pendingEditDocs=[]; warrantyEditMode=true; render(); }
function cancelWarrantyEdit(){ warrantyEditMode=false; render(); }

function saveWarrantyEdit(id){
  const item = data.warranties.find(x=>x.id===id);
  if(!item) return;
  const before={...item,tags:[...(item.tags||[])]};
  const draft={...item};

  ["name","brand","model","purchaseDate","expiry","scope","tag","purchaseType","seller","website","address","sellerEmail","purchaseEmail","orderNumber"].forEach(k=>{
    const el=document.querySelector("#field-"+k);
    if(el) draft[k]=el.value;
  });
  const amount=document.querySelector("#field-amount");
  if(amount) draft.amount=Number((amount.value||"0").replace(",","."));
  const notes=document.querySelector("#field-notes");
  if(notes) draft.notes=notes.value;
  draft.tags=Array.from(new Set([draft.scope,...getSelectedTags("w")].filter(Boolean)));

  const details=warrantyDiffs(draft,before);
  const newDocs=[...pendingEditDocs];

  if(!details.length && !newDocs.length){
    warrantyEditMode=false;
    render();
    return;
  }

  showSaveDecision({
    key:"warranties",details,newDocs,
    rollback:()=>{
      warrantyEditMode=true;
      render();
    },
    commit:(mode)=>{
      Object.assign(item,draft);
      if(mode==="change"){
        registerWarrantyChanges(item,before,newDocs);
      }else if(newDocs.length){
        const hist=ensureHistory(item,"warranties");
        const target=hist[hist.length-1] || hist[0];
        target.documents=target.documents||[];
        target.documents.push(...newDocs);
      }
      pendingEditDocs=[];
      saveLifeHubState?.();
      warrantyEditMode=false;
      render();
    }
  });
}

function uploadWarrantyDocument(event,id){
  const file = event.target.files?.[0];
  if (!file) return;
  const item = data.warranties.find(x=>x.id===id);
  const lower = file.name.toLowerCase();
  let type = lower.includes("factura") ? "Factura" : lower.includes("ticket") ? "Ticket" : lower.includes("garantia") ? "Garantia" : "Document";
  const url = URL.createObjectURL(file);
  item.documents.push({type, name:file.name, url});
  render();
}
function removeWarrantyDocument(id,index){
  const item = data.warranties.find(x=>x.id===id);
  item.documents.splice(index,1);
  render();
}


function deleteWarranty(id){
  if (!confirm("Segur que vols eliminar aquest element? Aquesta acció no es pot desfer.")) return;
  const idx = data.warranties.findIndex(x=>x.id===id);
  if (idx>=0) data.warranties.splice(idx,1);
  selectedWarrantyId=null;
  warrantyEditMode=false;
  render();
}

function editWarrantyDocument(id,index){
  const item = data.warranties.find(x=>x.id===id);
  const doc = item?.documents[index];
  if (!doc) return;
  const newName = prompt("Nom del document:", doc.name);
  if (newName === null) return;
  const newType = prompt("Tipus (Factura, Ticket, Garantia, Document):", doc.type);
  if (newType === null) return;
  doc.name = newName.trim() || doc.name;
  doc.type = newType.trim() || doc.type;
  render();
}

function replaceWarrantyDocument(event,id,index){
  const file = event.target.files?.[0];
  if (!file) return;
  const item = data.warranties.find(x=>x.id===id);
  const doc = item?.documents[index];
  if (!doc) return;
  doc.name = file.name;
  if (doc.url) URL.revokeObjectURL(doc.url);
  doc.url = URL.createObjectURL(file);
  render();
}

function previewWarrantyDocument(id,index){
  const item = data.warranties.find(x=>x.id===id);
  const doc = item?.documents[index];
  if (!doc) return;
  if (doc.url) {
    window.open(doc.url, "_blank");
  } else {
    alert("Aquest document de mostra no té un fitxer real adjunt. Puja o substitueix el document per poder-lo previsualitzar.");
  }
}

function downloadWarrantyDocument(id,index){
  const item = data.warranties.find(x=>x.id===id);
  const doc = item?.documents[index];
  if (!doc) return;
  if (!doc.url) {
    alert("Aquest document de mostra no té un fitxer real adjunt. Puja o substitueix el document per poder-lo descarregar.");
    return;
  }
  const a = document.createElement("a");
  a.href = doc.url;
  a.download = doc.name || "document";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function parseLifeHubDate(value, fallbackYear=2026){
  if(!value) return null;
  const months={GEN:0,FEB:1,MAR:2,ABR:3,MAI:4,JUN:5,JUL:6,AGO:7,SET:8,OCT:9,NOV:10,DES:11};
  const clean=String(value).trim().toUpperCase().replace(/\s+/g," ");
  let m=clean.match(/^(\d{1,2})\s+([A-ZÀ-Ü]{3})\s+(\d{4})$/);
  if(m && months[m[2]] !== undefined) return new Date(Number(m[3]),months[m[2]],Number(m[1]));
  m=clean.match(/^(\d{1,2})\s+([A-ZÀ-Ü]{3})$/);
  if(m && months[m[2]] !== undefined) return new Date(fallbackYear,months[m[2]],Number(m[1]));
  const iso=clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(iso) return new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3]));
  return null;
}
function agendaEvents(){
  const events=[];
  ["subscriptions","insurance","maintenance","digital"].forEach(key=>{
    (data[key]||[]).forEach(item=>{
      if(!itemHasTag(item,currentFilter) || !item.next) return;
      events.push({
        name:item.name,date:item.next,parsed:parseLifeHubDate(item.next),
        section:key,
        sectionLabel:{subscriptions:"Subscripció",insurance:"Assegurança",maintenance:"Manteniment",digital:"Domini i digital"}[key],
        scope:item.scope || (item.tags?.[0] || ""),tag:item.tag || ""
      });
    });
  });
  (data.warranties||[]).forEach(item=>{
    if(!itemHasTag(item,currentFilter) || !item.expiry) return;
    events.push({
      name:item.name,date:item.expiry,parsed:parseLifeHubDate(item.expiry),
      section:"warranties",sectionLabel:"Fi de garantia",
      scope:item.scope || (item.tags?.[0] || ""),tag:item.tag || item.brand || ""
    });
  });
  return events;
}
function monthCalendar(events, year=2026, month=8){
  const monthNames=["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"];
  const first=new Date(year,month,1);
  const days=new Date(year,month+1,0).getDate();
  const start=(first.getDay()+6)%7;
  const cells=[];
  for(let i=0;i<start;i++) cells.push(`<div class="calendar-cell is-empty"></div>`);
  for(let d=1;d<=days;d++){
    const dayEvents=events.filter(ev=>ev.parsed && ev.parsed.getFullYear()===year && ev.parsed.getMonth()===month && ev.parsed.getDate()===d);
    cells.push(`<div class="calendar-cell">
      <div class="calendar-day">${d}</div>
      <div class="calendar-events">
        ${dayEvents.map(ev=>`<div class="calendar-event event-${ev.section}" title="${ev.sectionLabel}: ${ev.name}">${ev.name}</div>`).join("")}
      </div>
    </div>`);
  }
  return `<div class="calendar-card">
    <div class="calendar-head"><h3>${monthNames[month]} ${year}</h3><span class="muted">Vista mensual</span></div>
    <div class="calendar-weekdays">${["Dl","Dt","Dc","Dj","Dv","Ds","Dg"].map(x=>`<div>${x}</div>`).join("")}</div>
    <div class="calendar-grid">${cells.join("")}</div>
  </div>`;
}
function miniMonthCalendar(events, year, month){
  const names=["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"];
  const first=new Date(year,month,1);
  const days=new Date(year,month+1,0).getDate();
  const start=(first.getDay()+6)%7;
  const cells=[];
  for(let i=0;i<start;i++) cells.push(`<span></span>`);
  for(let d=1;d<=days;d++){
    const dayEvents=events.filter(ev=>ev.parsed && ev.parsed.getFullYear()===year && ev.parsed.getMonth()===month && ev.parsed.getDate()===d);
    const sections=[...new Set(dayEvents.map(ev=>ev.section))];
    const tooltip=dayEvents.length ? dayEvents.map(ev=>`${ev.sectionLabel}: ${ev.name}`).join(" · ") : "";

    const colorMap={
      subscriptions:"var(--section-subscriptions)",
      warranties:"var(--section-warranties)",
      insurance:"var(--section-insurance)",
      maintenance:"var(--section-maintenance)",
      digital:"var(--section-digital)"
    };

    let eventStyle="";
    if(sections.length===1){
      eventStyle=`--event-bg:${colorMap[sections[0]]};`;
    }else if(sections.length>1){
      const step=100/sections.length;
      const stops=sections.map((section,i)=>{
        const start=(i*step).toFixed(2);
        const end=((i+1)*step).toFixed(2);
        return `${colorMap[section]} ${start}% ${end}%`;
      }).join(", ");
      eventStyle=`--event-bg:conic-gradient(${stops});`;
    }

    cells.push(`<span class="${dayEvents.length ? "has-event annual-event-circle" : ""}" style="${eventStyle}" title="${tooltip}">${d}</span>`);
  }
  return `<div class="mini-month"><strong>${names[month]}</strong><div class="mini-grid">${cells.join("")}</div></div>`;
}
function agendaView() {
  const events=agendaEvents().sort((a,b)=>(a.parsed?.getTime()||Infinity)-(b.parsed?.getTime()||Infinity));
  const title=currentFilter==="Tots" ? "Agenda global" : `Agenda · ${currentFilter}`;
  const subtitle=currentFilter==="Tots"
    ? "Tots els venciments, renovacions, manteniments i garanties."
    : `Només els venciments, renovacions, manteniments i garanties associats a ${currentFilter}.`;

  return `
    <div class="section-title">
      <div>
        <h2>${title}</h2>
        <div class="muted">${subtitle}</div>
      </div>
      <span class="muted">${events.length} elements</span>
    </div>

    <div class="panel">
      <div class="agenda-list">
        ${events.map(ev=>`
          <div class="agenda-row">
            <div class="agenda-date">${ev.date}</div>
            <div class="agenda-main">
              <strong>${ev.name}</strong>
              <div class="item-sub">${ev.tag}</div>
            </div>
            <span class="type-pill type-${ev.section}">${ev.sectionLabel}</span>
            ${ev.scope ? `<span class="tag">${ev.scope}</span>` : ""}
          </div>
        `).join("") || `<div class="muted">No hi ha cap element a l’agenda amb aquesta etiqueta.</div>`}
      </div>
    </div>

    <div class="section-title"><h2>Calendari mensual</h2><span class="muted">Setembre 2026</span></div>
    ${monthCalendar(events,2026,8)}

    <div class="section-title"><h2>Calendari anual</h2><span class="muted">2026</span></div>
    <div class="year-calendar">
      ${Array.from({length:12},(_,m)=>miniMonthCalendar(events,2026,m)).join("")}
    </div>
  `;
}
function openRecurringByIndex(key,index){
  const item = data[key]?.[Number(index)];
  if (!item) return;
  selectedRecurring={key,name:item.name};
  recurringEditMode=false;
  render();
}
function openRecurringDocumentsByIndex(key,index){
  const item = data[key]?.[Number(index)];
  if (!item) return;
  selectedRecurring={key,name:item.name};
  recurringEditMode=false;
  render();
  requestAnimationFrame(()=>document.querySelector("#element-documents")?.scrollIntoView({behavior:"smooth",block:"start"}));
}
function openRecurringHistoryByIndex(key,index){
  const item = data[key]?.[Number(index)];
  if (!item) return;
  selectedRecurring={key,name:item.name};
  recurringEditMode=false;
  render();
  requestAnimationFrame(()=>document.querySelector("#element-history")?.scrollIntoView({behavior:"smooth",block:"start"}));
}
function editRecurringByIndex(key,index){
  const item = data[key]?.[Number(index)];
  if (!item) return;
  selectedRecurring={key,name:item.name};
  recurringEditMode=true;
  render();
}
function deleteRecurringByIndex(key,index){
  const item = data[key]?.[Number(index)];
  if (!item) return;
  if (!confirm("Segur que vols eliminar aquest element? Aquesta acció no es pot desfer.")) return;
  data[key].splice(Number(index),1);
  selectedRecurring=null;
  recurringEditMode=false;
  render();
}

function bindDynamicActions(){
  document.querySelectorAll(".recurring-action").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const {action,key,index} = btn.dataset;
      if (action==="view") openRecurringByIndex(key,index);
      if (action==="history") openRecurringHistoryByIndex(key,index);
      if (action==="edit") editRecurringByIndex(key,index);
      if (action==="delete") deleteRecurringByIndex(key,index);
    });
  });
}

function openAddForType(type, contextTag=null){
  addType = type;
  addReturnView = currentView;
  openAddModal(contextTag, true);
}
function openAddModal(contextTag=null, preserveReturnView=false){
  if (!preserveReturnView) addReturnView = currentView;
  addContextTag = contextTag;
  addModalOpen = true;
  renderAddModal();
}
function closeAddModal(){
  addModalOpen = false;
  document.querySelector("#add-modal")?.remove();
}
function renderAddModal(){
  document.querySelector("#add-modal")?.remove();
  const wrap = document.createElement("div");
  wrap.id = "add-modal";
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `
    <div class="modal-card">
      <div class="panel-header">
        <div>
          <h2>Afegir element</h2>
          <div class="muted">${addContextTag ? `S’afegirà automàticament a ${addContextTag}.` : "Tria el tipus i completa les dades bàsiques."}</div>
        </div>
        <button class="icon-action" onclick="closeAddModal()">✕</button>
      </div>

      <label class="field">
        <span>Tipus</span>
        <select id="add-type">
          <option value="subscriptions">Subscripció</option>
          <option value="warranties">Compra i garantia</option>
          <option value="insurance">Assegurança</option>
          <option value="maintenance">Manteniment</option>
          <option value="digital">Domini i digital</option>
        </select>
      </label>

      <div id="add-form-area"></div>

      <div class="modal-actions">
        <button class="secondary-btn" onclick="closeAddModal()">Cancel·lar</button>
        <button class="primary-btn" onclick="saveNewItem()">Afegir</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const select = document.querySelector("#add-type");
  select.value = addType;
  select.addEventListener("change", e=>{ addType=e.target.value; renderAddForm(); });
  renderAddForm();
}

function renderAddForm(){
  const area = document.querySelector("#add-form-area");
  if (!area) return;
  if (addType === "warranties") {
    area.innerHTML = `
      <div class="form-grid modal-form">
        ${fieldInput("Producte","add-name","")}
        ${fieldInput("Marca","add-brand","")}
        ${fieldInput("Model","add-model","")}
        ${fieldInput("Preu","add-amount","","number")}
        ${fieldInput("Data de compra","add-purchaseDate","")}
        ${fieldInput("Garantia fins","add-expiry","")}
        ${fieldSelect("Àmbit principal","add-scope",(["Personal","Professional","Casa","Cotxe","Mascotes","Salut"].includes(addContextTag) ? addContextTag : "Personal"),["Personal","Professional","Casa","Cotxe","Mascotes","Salut"])}
        ${tagMultiSelect("add", [(["Personal","Professional","Casa","Cotxe","Mascotes","Salut"].includes(addContextTag) ? addContextTag : "Personal")].filter(Boolean))}
        ${fieldInput("Categoria","add-tag","")}
        ${fieldInput("Botiga / web","add-seller","")}
        ${fieldInput("Web","add-website","")}
        ${fieldInput("Email utilitzat","add-purchaseEmail","","email")}
        ${fieldInput("Núm. comanda","add-orderNumber","")}
        ${simpleDocumentsField("create")}
      </div>`;
  } else {
    area.innerHTML = `
      <div class="form-grid modal-form">
        ${fieldInput("Nom","add-name","")}
        ${fieldSelect("Àmbit principal","add-scope",(["Personal","Professional","Casa","Cotxe","Mascotes","Salut"].includes(addContextTag) ? addContextTag : "Personal"),["Personal","Professional","Casa","Cotxe","Mascotes","Salut"])}
        ${tagMultiSelect("add", [(["Personal","Professional","Casa","Cotxe","Mascotes","Salut"].includes(addContextTag) ? addContextTag : "Personal")].filter(Boolean))}
        ${addType === "subscriptions" ? subscriptionTypeFields("add","Software") : fieldInput("Tipus / categoria","add-tag","")}
        ${fieldInput("Cost mensual","add-monthly","","number")}
        ${fieldInput("Cost anual","add-annual","","number")}
        ${recurrenceFields("add",null,addType)}
        ${simpleDocumentsField("create")}
      </div>`;
    if (addType === "subscriptions") bindSubscriptionTypeToggle("add");
    bindRecurrenceFields("add",addType);
  }
}


let pendingCreateDocs=[];
let pendingEditDocs=[];

let pendingSaveDecision=null;

function recurringDiffs(item,key,before){
  return [
    changeDetail("Nom",before.name,item.name),
    changeDetail(key==="subscriptions"?"Pla / categoria":"Tipus",before.tag,item.tag),
    changeDetail("Cost mensual",before.monthly,item.monthly,true),
    changeDetail("Cost anual",before.annual,item.annual,true),
    changeDetail("Data de referència",before.startDate||"",item.startDate||""),
    changeDetail("Periodicitat",inferFrequency(before,key),inferFrequency(item,key)),
    changeDetail("Proper venciment",before.next,item.next),
    changeDetail("Àmbit",before.scope,item.scope)
  ].filter(Boolean);
}

function warrantyDiffs(item,before){
  return [
    changeDetail("Producte",before.name,item.name),
    changeDetail("Preu",before.amount,item.amount,true),
    changeDetail("Garantia fins",before.expiry,item.expiry),
    changeDetail("Botiga",before.seller,item.seller),
    changeDetail("Model",before.model,item.model)
  ].filter(Boolean);
}

function saveDecisionModal(){
  if(!pendingSaveDecision) return "";
  const {details,newDocs=[]}=pendingSaveDecision;
  const rows=(details||[]).map(d=>`
    <div class="save-decision-change">
      <span>${d.label}</span>
      <strong>${d.from ? `${d.from} → `:""}${d.to||""}</strong>
    </div>`).join("");
  const themeKey=pendingSaveDecision.key||currentView||"subscriptions";
  return `<div class="save-decision-overlay theme-${themeKey}">
    <div class="save-decision-card">
      <button class="save-decision-close" onclick="cancelSaveDecision()" aria-label="Tancar">×</button>
      <div class="eyebrow">Abans de desar</div>
      <h2>Has modificat informació</h2>
      <p>És una correcció perquè t'havies equivocat, o és un canvi real que vols conservar a l'historial?</p>
      ${rows?`<div class="save-decision-changes">${rows}</div>`:""}
      ${newDocs.length?`<div class="save-decision-docs">📎 ${newDocs.length} document${newDocs.length===1?"":"s"} nou${newDocs.length===1?"":"s"}</div>`:""}
      <div class="save-decision-actions">
        <button class="secondary-btn" onclick="resolveSaveDecision('correction')">
          <strong>Corregir dades</strong>
          <span>Actualitza la fitxa sense crear historial</span>
        </button>
        <button class="primary-btn" onclick="resolveSaveDecision('change')">
          <strong>Registrar com a canvi</strong>
          <span>Actualitza la fitxa i ho guarda a l'historial</span>
        </button>
      </div>
      <button class="text-btn save-decision-cancel" onclick="cancelSaveDecision()">Cancel·lar</button>
    </div>
  </div>`;
}

function showSaveDecision(payload){
  pendingSaveDecision=payload;
  document.querySelector("#save-decision-root")?.remove();
  const root=document.createElement("div");
  root.id="save-decision-root";
  root.innerHTML=saveDecisionModal();
  document.body.appendChild(root);
}

function cancelSaveDecision(){
  const p=pendingSaveDecision;
  pendingSaveDecision=null;
  document.querySelector("#save-decision-root")?.remove();
  if(p?.rollback) p.rollback();
}

function resolveSaveDecision(mode){
  const p=pendingSaveDecision;
  if(!p) return;
  pendingSaveDecision=null;
  document.querySelector("#save-decision-root")?.remove();
  p.commit(mode);
}


function simpleDocumentsField(mode, existing=[]){
  const pending=mode==="create"?pendingCreateDocs:pendingEditDocs;
  return `<div class="simple-doc-field field-wide">
    <label>Documents</label>
    <div class="simple-doc-list">
      ${(existing||[]).map(d=>`<span class="simple-doc-chip">📎 ${d.name}</span>`).join("")}
      ${pending.map((d,i)=>`<span class="simple-doc-chip new">📎 ${d.name}<button type="button" onclick="removePendingDoc('${mode}',${i})">×</button></span>`).join("")}
    </div>
    <label class="simple-upload-btn">+ Afegir document
      <input type="file" hidden multiple onchange="queueSimpleDocs(event,'${mode}')">
    </label>
    <div class="field-help">${mode==="create"?"Aquests documents quedaran guardats amb l'alta inicial.":"Els documents nous quedaran vinculats automàticament al canvi que desis."}</div>
  </div>`;
}
function queueSimpleDocs(event,mode){
  const files=Array.from(event.target.files||[]).map(f=>({name:f.name,type:docTypeFromName(f.name)}));
  if(mode==="create") pendingCreateDocs.push(...files); else pendingEditDocs.push(...files);
  if(mode==="create") renderAddForm(); else render();
}
function removePendingDoc(mode,index){
  if(mode==="create") pendingCreateDocs.splice(index,1); else pendingEditDocs.splice(index,1);
  if(mode==="create") renderAddForm(); else render();
}
function currentGeneralDocs(item,key){
  const hist=ensureHistory(item,key);
  return hist.flatMap(h=>h.documents||[]);
}

function getVal(id){ return document.querySelector("#field-"+id)?.value ?? ""; }

function saveNewItem(){
  if (addType === "warranties") {
    const name = getVal("add-name").trim();
    if (!name) return alert("Escriu el nom del producte.");
    data.warranties.push({
      id:"w-"+Date.now(),
      name,
      brand:getVal("add-brand"),
      model:getVal("add-model"),
      scope:getVal("add-scope") || "Personal",
      tags:Array.from(new Set([getVal("add-scope") || "Personal", ...getSelectedTags("add"), ...(addContextTag ? [addContextTag] : [])])),
      amount:Number(getVal("add-amount") || 0),
      purchaseDate:getVal("add-purchaseDate"),
      expiry:getVal("add-expiry"),
      tag:addType === "subscriptions" ? getSubscriptionTypeValue("add") : getVal("add-tag"),
      purchaseType:"Online",
      seller:getVal("add-seller"),
      website:getVal("add-website"),
      address:"",
      sellerEmail:"",
      purchaseEmail:getVal("add-purchaseEmail"),
      orderNumber:getVal("add-orderNumber"),
      notes:"",
      documents:[]
    });
    const created=data.warranties[data.warranties.length-1];
    created.history=[{date:created.purchaseDate||historyDateToday(),title:"Compra registrada",text:`${created.name} · ${fmt(created.amount||0)}`,type:"created",amount:Number(created.amount||0),details:[],documents:[...pendingCreateDocs]}];
    pendingCreateDocs=[];
    currentView="warranties";
  } else {
    const name = getVal("add-name").trim();
    if (!name) return alert("Escriu un nom.");
    const recurrence=getRecurrenceData("add",addType,"—");
    data[addType].push({
      name,
      scope:getVal("add-scope") || "Personal",
      tags:Array.from(new Set([getVal("add-scope") || "Personal", ...getSelectedTags("add"), ...(addContextTag ? [addContextTag] : [])])),
      tag:addType === "subscriptions" ? getSubscriptionTypeValue("add") : getVal("add-tag"),
      monthly:Number(getVal("add-monthly") || 0),
      annual:Number(getVal("add-annual") || 0),
      startDate:recurrence.startDate,
      frequency:recurrence.frequency,
      next:recurrence.next,
      notes:""
    });
    const created=data[addType][data[addType].length-1];
    created.history=[{date:historyDateToday(),title:"Element afegit",text:"",type:"created",amount:null,details:[],documents:[...pendingCreateDocs]}];
    pendingCreateDocs=[];
    currentView = {
      subscriptions:"subscriptions",
      insurance:"insurance",
      maintenance:"maintenance",
      digital:"digital"
    }[addType];
  }

  const returnTag = addContextTag;
  const returnView = addReturnView;
  addModalOpen=false;
  addContextTag=null;
  addReturnView=null;

  if (returnView === "dashboard" && returnTag) {
    currentView="dashboard";
    currentFilter=returnTag;
    tagDashboardOpen=true;
  } else {
    if (returnView) currentView = returnView;
    tagDashboardOpen=false;
  }

  document.querySelectorAll(".nav-item").forEach(b=>{
    b.classList.toggle("active", b.dataset.view===currentView);
  });
  render();
}
function render() {
  const container = document.querySelector("#view-container");
  if (tagDashboardOpen && currentFilter !== "Tots") {
    document.querySelector("#page-title").textContent = "Dashboard · " + currentFilter;
    container.className = "theme-dashboard";
    container.innerHTML = tagDashboard(currentFilter);
    return;
  }
  const title = document.querySelector("#page-title");
  const views = {
    dashboard: ["Bon vespre, Paula", dashboard()],
    subscriptions: ["Subscripcions", recurringView("Subscripcions", data.subscriptions, "subscripcions actives", "subscriptions")],
    warranties: ["Compres i garanties", warrantiesView()],
    insurance: ["Assegurances", recurringView("Assegurances", data.insurance, "pòlisses actives", "insurance")],
    maintenance: ["Manteniments", recurringView("Manteniments", data.maintenance, "manteniments", "maintenance")],
    digital: ["Dominis i digital", recurringView("Dominis i digital", data.digital, "serveis actius", "digital")],
    agenda: ["Agenda", agendaView()]
  };
  title.textContent = views[currentView][0];
  container.className = `theme-${currentView}`;
  container.innerHTML = views[currentView][1];
  bindDynamicActions();
  if (currentView === "subscriptions" && selectedRecurring && recurringEditMode) bindSubscriptionTypeToggle("r");
  if (addModalOpen) renderAddModal();
}

document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    currentView = btn.dataset.view;
    selectedWarrantyId = null;
    warrantyEditMode = false;
    selectedRecurring = null;
    recurringEditMode = false;
    tagDashboardOpen = false;

    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");

    // Manté el filtre seleccionat, però no força un dashboard d'etiqueta fora del Dashboard.
    render();
  });
});

document.querySelectorAll(".chip").forEach(btn=>{
  if (btn.id === "add-tag-filter") return;
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    openTagDashboard(btn.dataset.filter);
  });
});

render();

let customTags = [];
let tagDeleteState = null;

function allAvailableTags(){
  return ["Personal","Professional","Casa","Cotxe","Mascotes","Salut",...customTags];
}

function countItemsWithTag(tag){
  return allSections().reduce((total,section)=> total + (data[section.key]||[]).filter(item=>itemHasTag(item,tag)).length, 0);
}

function renderCustomTagChip(name){
  const plus=document.querySelector("#add-tag-filter");
  if(!plus) return;
  const wrap=document.createElement("div");
  wrap.className="custom-tag-wrap";
  wrap.dataset.customTag=name;

  const btn=document.createElement("button");
  btn.className="chip";
  btn.dataset.filter=name;
  btn.textContent=name;
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    openTagDashboard(name);
  });

  const del=document.createElement("button");
  del.className="tag-delete-btn";
  del.type="button";
  del.setAttribute("aria-label",`Eliminar etiqueta ${name}`);
  del.title="Eliminar etiqueta";
  del.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>`;
  del.addEventListener("click",(e)=>{ e.stopPropagation(); requestDeleteTag(name); });

  wrap.appendChild(btn);
  wrap.appendChild(del);
  plus.parentNode.insertBefore(wrap,plus);
}

function requestDeleteTag(tag){
  const count=countItemsWithTag(tag);
  if(count===0){
    if(!confirm(`Vols eliminar l’etiqueta “${tag}”?`)) return;
    removeCustomTag(tag);
    return;
  }
  tagDeleteState={tag,count};
  renderTagDeleteModal();
}

function renderTagDeleteModal(){
  document.querySelector("#tag-delete-modal")?.remove();
  if(!tagDeleteState) return;
  const {tag,count}=tagDeleteState;
  const replacements=allAvailableTags().filter(x=>x!==tag);
  const modal=document.createElement("div");
  modal.id="tag-delete-modal";
  modal.className="modal-backdrop";
  modal.innerHTML=`
    <div class="modal-card tag-delete-modal-card">
      <div class="modal-head">
        <div>
          <div class="eyebrow">Eliminar etiqueta</div>
          <h2>Reassignar abans d’eliminar</h2>
        </div>
        <button class="icon-btn" onclick="cancelDeleteTag()">×</button>
      </div>
      <div class="tag-delete-warning">
        L’etiqueta <strong>${tag}</strong> està assignada a <strong>${count} ${count===1?"element":"elements"}</strong>.
        Abans d’eliminar-la, has de triar a quina etiqueta els vols reassignar.
      </div>
      <label class="field-label">Nova etiqueta</label>
      <select class="input" id="tag-reassign-select">
        ${replacements.map(x=>`<option value="${x}">${x}</option>`).join("")}
      </select>
      <div class="modal-actions">
        <button class="secondary-btn" onclick="cancelDeleteTag()">Cancel·lar</button>
        <button class="danger-btn" onclick="confirmDeleteTag()">Reassignar i eliminar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function cancelDeleteTag(){
  tagDeleteState=null;
  document.querySelector("#tag-delete-modal")?.remove();
}

function confirmDeleteTag(){
  if(!tagDeleteState) return;
  const oldTag=tagDeleteState.tag;
  const newTag=document.querySelector("#tag-reassign-select")?.value;
  if(!newTag) return;
  allSections().forEach(section=>{
    (data[section.key]||[]).forEach(item=>{
      if(!itemHasTag(item,oldTag)) return;
      const tags=Array.isArray(item.tags) ? [...item.tags] : (item.scope ? [item.scope] : []);
      item.tags=Array.from(new Set(tags.map(t=>t===oldTag?newTag:t).filter(t=>t!==oldTag)));
      if(item.scope===oldTag) item.scope=newTag;
      if(!item.tags.includes(newTag)) item.tags.push(newTag);
    });
  });
  cancelDeleteTag();
  removeCustomTag(oldTag);
}

function removeCustomTag(tag){
  customTags=customTags.filter(x=>x!==tag);
  document.querySelector(`.custom-tag-wrap[data-custom-tag="${CSS.escape(tag)}"]`)?.remove();
  if(currentFilter===tag){
    currentFilter="Tots";
    tagDashboardOpen=false;
    document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Tots"));
  }
  render();
}

/* ===== Product enhancements v32 ===== */
function allLifeHubItems(){
  return allSections().flatMap(section => (data[section.key]||[]).map(item=>({...item, _section:section.key, _sectionLabel:section.label})));
}
function daysUntil(value){
  const d=parseLifeHubDate(value);
  if(!d) return null;
  const now=new Date(2026,8,12);
  return Math.ceil((d-now)/(1000*60*60*24));
}
function attentionItems(){
  return agendaEvents().map(ev=>({...ev,days:daysUntil(ev.date)}))
    .filter(ev=>ev.days!==null && ev.days>=0 && ev.days<=45)
    .sort((a,b)=>a.days-b.days);
}
function attentionPanel(){
  const items=attentionItems().slice(0,5);
  return `<div class="attention-panel">
    <div class="attention-head">
      <div><div class="eyebrow">Prioritat</div><h2>Necessita la teva atenció</h2></div>
      <span class="attention-count">${items.length}</span>
    </div>
    <div class="attention-list">
      ${items.length?items.map(ev=>`<div class="attention-item">
        <span class="attention-dot event-${ev.section}"></span>
        <div class="attention-copy"><strong>${ev.name}</strong><span>${ev.sectionLabel} · ${ev.date}</span></div>
        <span class="attention-when">${ev.days===0?"Avui":ev.days===1?"Demà":`En ${ev.days} dies`}</span>
      </div>`).join(""):`<div class="empty-soft">No tens res urgent durant els pròxims 45 dies.</div>`}
    </div>
  </div>`;
}
function injectAttention(){
  if(currentView!=="dashboard" || tagDashboardOpen) return;
  const vc=document.querySelector("#view-container");
  if(!vc || vc.querySelector(".attention-panel")) return;
  const firstSection=vc.querySelector(".section-title");
  if(firstSection) firstSection.insertAdjacentHTML("beforebegin",attentionPanel());
  else vc.insertAdjacentHTML("afterbegin",attentionPanel());
}
function sectionNameForSearch(key){
  return {subscriptions:"Subscripcions",warranties:"Compres i garanties",insurance:"Assegurances",maintenance:"Manteniments",digital:"Dominis i digital"}[key]||key;
}
function runGlobalSearch(q){
  const box=document.querySelector("#global-search-results");
  if(!box) return;
  q=(q||"").trim().toLowerCase();
  if(!q){box.classList.remove("open");box.innerHTML="";return;}
  const results=allLifeHubItems().filter(item=>{
    const hay=[item.name,item.brand,item.model,item.scope,item.tag,item.notes,item.website,item.seller,item.orderNumber,item.purchaseEmail,...(item.tags||[])].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  }).slice(0,8);
  box.innerHTML=results.length?results.map(item=>`<button class="search-result" data-section="${item._section}" data-id="${item.id||""}" data-name="${String(item.name||"").replace(/"/g,"&quot;")}">
    <span class="search-result-icon event-${item._section}"></span>
    <span><strong>${item.name}</strong><small>${sectionNameForSearch(item._section)} · ${item.scope||item.tags?.[0]||""}</small></span>
  </button>`).join(""):`<div class="search-empty">No he trobat cap resultat.</div>`;
  box.classList.add("open");
  box.querySelectorAll(".search-result").forEach(btn=>btn.addEventListener("click",()=>{
    const section=btn.dataset.section;
    box.classList.remove("open");
    document.querySelector("#global-search").value="";
    if(section==="warranties"){
      const item=(data.warranties||[]).find(x=>String(x.id)===String(btn.dataset.id) || x.name===btn.dataset.name);
      if(item){currentView="warranties";selectedWarrantyId=item.id;warrantyEditMode=false;tagDashboardOpen=false;render();return;}
    }
    const arr=data[section]||[];
    const idx=arr.findIndex(x=>x.name===btn.dataset.name);
    if(idx>=0){currentView=section;selectedRecurring={key:section,index:idx};recurringEditMode=false;tagDashboardOpen=false;render();}
  }));
}
function bindGlobalSearch(){
  const input=document.querySelector("#global-search");
  if(!input || input.dataset.bound) return;
  input.dataset.bound="1";
  input.addEventListener("input",()=>runGlobalSearch(input.value));
  document.addEventListener("click",e=>{
    if(!e.target.closest(".global-search-wrap")) document.querySelector("#global-search-results")?.classList.remove("open");
  });
}
function notificationSummary(){
  const items=attentionItems();
  return {seven:items.filter(x=>x.days<=7).length,thirty:items.filter(x=>x.days<=30).length,total:items.length};
}
function enrichDashboard(){
  injectAttention();
  bindGlobalSearch();
}
const _lifehubRender=render;
render=function(){
  _lifehubRender();
  requestAnimationFrame(enrichDashboard);
};

/* ===== v36 / full product layer ===== */
const LIFEHUB_STORAGE_KEY="lifehub-v36-data";
const LIFEHUB_PREFS_KEY="lifehub-v36-prefs";
let lifehubPrefs={onboarded:false, reminderDays:15};

function loadLifeHubState(){
  try{
    const saved=localStorage.getItem(LIFEHUB_STORAGE_KEY);
    if(saved){
      const parsed=JSON.parse(saved);
      Object.keys(data).forEach(k=>{ if(Array.isArray(parsed[k])) data[k]=parsed[k]; });
    }
    lifehubPrefs={...lifehubPrefs,...JSON.parse(localStorage.getItem(LIFEHUB_PREFS_KEY)||"{}")};
  }catch(e){}
}
function saveLifeHubState(){
  try{
    localStorage.setItem(LIFEHUB_STORAGE_KEY,JSON.stringify(data));
    localStorage.setItem(LIFEHUB_PREFS_KEY,JSON.stringify(lifehubPrefs));
  }catch(e){}
}
loadLifeHubState();

function ensureProductFields(item,key){
  if(!item) return item;
  if(!Array.isArray(item.documents)) item.documents=[];
  if(!Array.isArray(item.history)) item.history=[];
  if(!Array.isArray(item.tags)) item.tags=item.scope?[item.scope]:[];
  if(typeof item.reminderDays!=="number") item.reminderDays=lifehubPrefs.reminderDays||15;
  if(!item.asset) item.asset=inferAsset(item,key);
  return item;
}
function inferAsset(item,key){
  const txt=[item.name,item.tag,item.scope,...(item.tags||[])].join(" ").toLowerCase();
  if(txt.includes("cotxe")||txt.includes("vehicle")||txt.includes("itv")) return "Cotxe";
  if(txt.includes("casa")||txt.includes("llar")||txt.includes("aerot")) return "Casa";
  if(txt.includes("macbook")) return "MacBook Pro";
  if(txt.includes("iphone")) return "iPhone";
  if(txt.includes("masc")||txt.includes("blat")) return "Blat";
  return "";
}
Object.keys(data).forEach(k=>data[k].forEach(i=>ensureProductFields(i,k)));

function productItem(key,ref){
  if(key==="warranties") return data.warranties.find(x=>x.id===ref || x.name===ref);
  return data[key]?.find(x=>x.name===ref);
}
function autoHistory(item,text){
  ensureProductFields(item,"");
  item.history.unshift({date:"12 SET 2026",text});
  saveLifeHubState();
}
function notificationEvents(){
  return agendaEvents().map(ev=>{
    const item=(data[ev.section]||[]).find(x=>x.name===ev.name) || (ev.section==="warranties" ? data.warranties.find(x=>x.name===ev.name):null);
    return {...ev,item,days:daysUntil(ev.date)};
  }).filter(x=>x.days!==null&&x.days>=0&&x.days<=(x.item?.reminderDays??lifehubPrefs.reminderDays));
}
function renderNotificationPanel(){
  const panel=document.querySelector("#notification-panel");
  const badge=document.querySelector("#notification-badge");
  if(!panel||!badge) return;
  const evs=notificationEvents().slice(0,8);
  badge.textContent=evs.length||"";
  badge.classList.toggle("show",evs.length>0);
  panel.innerHTML=`<div class="notify-head"><strong>Notificacions</strong><span>${evs.length} pendents</span></div>
    ${evs.length?evs.map(ev=>`<button class="notify-row" onclick="openNotificationItem('${ev.section}','${String(ev.name).replace(/'/g,"\\'")}')">
      <span class="attention-dot event-${ev.section}"></span><span><strong>${ev.name}</strong><small>${ev.days===0?"Avui":ev.days===1?"Demà":`En ${ev.days} dies`} · ${ev.date}</small></span>
    </button>`).join(""):`<div class="search-empty">No tens avisos pendents.</div>`}`;
}
function bindNotifications(){
  const bell=document.querySelector("#notification-bell");
  if(!bell||bell.dataset.bound) return;
  bell.dataset.bound="1";
  bell.addEventListener("click",e=>{e.stopPropagation();renderNotificationPanel();document.querySelector("#notification-panel")?.classList.toggle("open")});
}
function openNotificationItem(key,name){
  document.querySelector("#notification-panel")?.classList.remove("open");
  currentView=key; tagDashboardOpen=false;
  if(key==="warranties"){const i=data.warranties.find(x=>x.name===name); if(i)selectedWarrantyId=i.id;}
  else selectedRecurring={key,name};
  render();
}
function productDocumentsBlock(item,key){
  ensureProductFields(item,key);
  const ref=key==="warranties"?item.id:item.name;
  return `<div id="element-documents" class="section-title product-doc-title"><div><div class="eyebrow">Arxius de l’element</div><h2>Documents</h2></div><span class="muted">${item.documents.length} arxius</span></div>
  <div class="panel product-doc-panel">
    <div class="documents-list">${item.documents.map((d,i)=>`<div class="document-row"><div><strong>${d.name}</strong><div class="item-sub">${d.type||"Document"}</div></div><div class="doc-actions"><button class="danger-btn compact" onclick="removeProductDocument('${key}','${String(ref).replace(/'/g,"\\'")}',${i})">Eliminar</button></div></div>`).join("")||`<div class="muted">Encara no hi ha documents.</div>`}</div>
    <label class="upload-drop">＋ Arrossega o selecciona factura, contracte, pòlissa o informe<input type="file" hidden onchange="uploadProductDocument(event,'${key}','${String(ref).replace(/'/g,"\\'")}')"></label>
    <div class="muted upload-note">Prototip: els fitxers nous es mantenen com a referència local, sense pujar-los al núvol.</div>
  </div>`;
}
function uploadProductDocument(event,key,ref){
  const f=event.target.files?.[0]; if(!f)return;
  const item=productItem(key,ref); if(!item)return;
  ensureProductFields(item,key);
  item.documents.push({type:"Document",name:f.name});
  autoHistory(item,`Document afegit · ${f.name}`);
  render();
}
function removeProductDocument(key,ref,index){
  const item=productItem(key,ref); if(!item)return;
  const d=item.documents[index]; if(!confirm(`Eliminar ${d?.name||"aquest document"}?`))return;
  item.documents.splice(index,1); autoHistory(item,"Document eliminat"); render();
}
function reminderBlock(item,key){
  ensureProductFields(item,key);
  const ref=key==="warranties"?item.id:item.name;
  return `<div class="panel reminder-card"><div><div class="eyebrow">Avisos</div><h3>Recorda-m'ho abans</h3><p class="muted">LifeHub t'avisarà abans del proper venciment.</p></div>
  <select onchange="setReminderDays('${key}','${String(ref).replace(/'/g,"\\'")}',this.value)">
    ${[7,15,30,45].map(n=>`<option value="${n}" ${item.reminderDays===n?"selected":""}>${n} dies abans</option>`).join("")}
  </select></div>`;
}
function setReminderDays(key,ref,val){
  const item=productItem(key,ref); if(!item)return;
  item.reminderDays=Number(val); saveLifeHubState?.(); renderNotificationPanel();
}
function assetCards(){
  const groups={};
  allSections().forEach(s=>(data[s.key]||[]).forEach(i=>{ensureProductFields(i,s.key);if(i.asset){(groups[i.asset]??=[]).push({...i,_section:s.key});}}));
  const entries=Object.entries(groups);
  return `<div class="section-title asset-title"><h2>Els teus actius</h2><span class="muted">Tot el que està relacionat, en un sol lloc</span></div>
  <div class="asset-grid">${entries.map(([name,items])=>`<button class="asset-card" onclick="openAsset('${name.replace(/'/g,"\\'")}')"><span class="asset-symbol">${name==="Casa"?"⌂":name==="Cotxe"?"↗":"•"}</span><strong>${name}</strong><small>${items.length} elements relacionats</small><div class="asset-dots">${[...new Set(items.map(x=>x._section))].map(k=>`<i class="event-${k}"></i>`).join("")}</div></button>`).join("")}</div>`;
}
let activeAsset=null;
function openAsset(name){activeAsset=name;currentView="dashboard";tagDashboardOpen=false;render();}
function assetView(name){
  const items=[];
  allSections().forEach(s=>(data[s.key]||[]).forEach(i=>{ensureProductFields(i,s.key);if(i.asset===name)items.push({...i,_section:s.key,_label:s.label})}));
  return `<div class="detail-toolbar"><button class="back-btn" onclick="activeAsset=null;render()">← Dashboard</button></div>
  <div class="asset-hero"><div class="eyebrow">Actiu</div><h2>${name}</h2><p>${items.length} elements relacionats</p></div>
  <div class="panel"><div class="asset-list">${items.map(i=>`<button onclick="openNotificationItem('${i._section}','${String(i.name).replace(/'/g,"\\'")}')"><span class="attention-dot event-${i._section}"></span><span><strong>${i.name}</strong><small>${i._label} · ${i.next||i.expiry||""}</small></span></button>`).join("")}</div></div>`;
}
function assignAssetBlock(item,key){
  ensureProductFields(item,key);
  const ref=key==="warranties"?item.id:item.name;
  return `<div class="panel relation-card"><div><div class="eyebrow">Relacionat amb</div><h3>${item.asset||"Cap actiu"}</h3><p class="muted">Agrupa assegurances, compres, manteniments i serveis.</p></div>
  <select onchange="setItemAsset('${key}','${String(ref).replace(/'/g,"\\'")}',this.value)">${["","Casa","Cotxe","MacBook Pro","iPhone","Blat"].map(a=>`<option value="${a}" ${item.asset===a?"selected":""}>${a||"Sense relacionar"}</option>`).join("")}</select></div>`;
}
function setItemAsset(key,ref,val){const item=productItem(key,ref);if(!item)return;item.asset=val;autoHistory(item,`Relació actualitzada · ${val||"sense actiu"}`);render();}
function dashboardExtra(){
  const annual=allRecurring().reduce((s,i)=>s+recurringAnnual(i),0);
  return `${assetCards()}<div class="section-title"><h2>Comparativa anual</h2><span class="muted">Evolució de la despesa</span></div>
  <div class="panel annual-compare"><div><span>2025</span><strong>Sense dades</strong><small>LifeHub encara no té historial suficient</small></div><div><span>2026</span><strong>${fmt(annual)}</strong><small>Despesa recurrent registrada</small></div></div>`;
}
function makeDashboardBarsClickable(){
  document.querySelectorAll(".bar-row").forEach(row=>{
    const name=row.querySelector("span")?.textContent?.trim();
    const map={"Subscripcions":"subscriptions","Assegurances":"insurance","Manteniments":"maintenance","Dominis i digital":"digital"};
    if(map[name]){row.classList.add("clickable");row.onclick=()=>{currentView=map[name];tagDashboardOpen=false;render();};}
  });
}
function detailEnhancements(){
  let item=null,key=null;
  if(selectedWarrantyId){key="warranties";item=data.warranties.find(x=>x.id===selectedWarrantyId);}
  else if(selectedRecurring){key=selectedRecurring.key;item=data[key]?.find(x=>x.name===selectedRecurring.name);}
  if(!item||recurringEditMode||warrantyEditMode)return;
  ensureProductFields(item,key);
  const vc=document.querySelector("#view-container");
  if(!vc)return;
  if(!vc.querySelector(".reminder-card")) vc.insertAdjacentHTML("beforeend",reminderBlock(item,key));
}
function showOnboarding(){
  if(lifehubPrefs.onboarded||document.querySelector("#onboarding-modal"))return;
  const el=document.createElement("div");el.id="onboarding-modal";el.className="modal-backdrop";
  el.innerHTML=`<div class="modal onboarding-modal"><div class="eyebrow">Benvinguda a LifeHub</div><h2>Què vols tenir sota control?</h2><p class="muted">Selecciona els àmbits que t'interessen. Després sempre els podràs canviar.</p>
  <div class="onboarding-options">${["Subscripcions","Casa","Cotxe","Professional","Mascotes","Salut"].map((x,i)=>`<label><input type="checkbox" ${i<4?"checked":""}><span>${x}</span></label>`).join("")}</div>
  <button class="primary-btn onboarding-start" onclick="finishOnboarding()">Començar</button></div>`;
  document.body.appendChild(el);
}
function finishOnboarding(){lifehubPrefs.onboarded=true;saveLifeHubState();document.querySelector("#onboarding-modal")?.remove();}
function persistAfterMutations(){
  saveLifeHubState();
}
function fullProductEnhance(){
  bindGlobalSearch();bindNotifications();renderNotificationPanel();
  if(currentView==="dashboard"&&!tagDashboardOpen&&!activeAsset){
    const vc=document.querySelector("#view-container");
    /* Actius retirats del Dashboard */
    makeDashboardBarsClickable();
  }
  detailEnhancements();
  /* onboarding retirat: no mostrar modal */
}
const _v36Render=render;
render=function(){
  if(false && activeAsset&&currentView==="dashboard"&&!tagDashboardOpen){
    document.querySelector("#page-title").textContent="Actius";
    const c=document.querySelector("#view-container");c.className="theme-dashboard";c.innerHTML=assetView(activeAsset);
    bindNotifications();renderNotificationPanel();return;
  }
  _v36Render();
  requestAnimationFrame(fullProductEnhance);
  saveLifeHubState();
};

render();

function createCustomTag(){
  const name = prompt("Nom de la nova etiqueta:");
  if(!name) return;
  const clean=name.trim();
  if(!clean) return;
  if(allAvailableTags().some(x=>x.toLowerCase()===clean.toLowerCase())) return;
  customTags.push(clean);
  renderCustomTagChip(clean);
}
document.querySelector("#add-tag-filter")?.addEventListener("click", (e)=>{
  e.stopPropagation();
  createCustomTag();
});
