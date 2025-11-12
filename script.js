 // ==== TORNEO MUNICIPAL DE VALDIVIA ==== //

let equipos = JSON.parse(localStorage.getItem("equipos")) || [];
let partidos = JSON.parse(localStorage.getItem("partidos")) || [];
let tabla = JSON.parse(localStorage.getItem("tabla")) || {};
const PASS = "admin123";

// --- LOGIN ADMIN ---
document.getElementById("btnEntrarAdmin").addEventListener("click", () => {
  const clave = document.getElementById("claveAdmin").value;
  if (clave === PASS) {
    document.getElementById("adminLogin").classList.add("oculto");
    document.getElementById("panelAdmin").classList.remove("oculto");
  } else alert("Contraseña incorrecta");
});

// --- REGISTRAR EQUIPO ---
document.getElementById("btnRegistrar").addEventListener("click", () => {
  const nombre = document.getElementById("nombreEquipo").value.trim();
  const archivo = document.getElementById("logoEquipo").files[0];
  if (!nombre) return alert("Ingresa un nombre");
  if (equipos.find(e => e.nombre === nombre)) return alert("Ese equipo ya existe");

  if (archivo) {
    const lector = new FileReader();
    lector.onload = e => {
      equipos.push({ nombre, logo: e.target.result });
      tabla[nombre] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, DG: 0, Pts: 0 };
      guardar();
      alert("Equipo registrado con éxito");
    };
    lector.readAsDataURL(archivo);
  } else {
    equipos.push({ nombre, logo: "" });
    tabla[nombre] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, DG: 0, Pts: 0 };
    guardar();
    alert("Equipo registrado con éxito");
  }

  document.getElementById("nombreEquipo").value = "";
  document.getElementById("logoEquipo").value = "";
});

// --- GENERAR PARTIDOS ---
document.getElementById("btnGenerar").addEventListener("click", () => {
  if (equipos.length < 2) return alert("Registra al menos dos equipos");
  partidos = [];
  for (let i = 0; i < equipos.length; i++) {
    for (let j = i + 1; j < equipos.length; j++) {
      partidos.push({ local: equipos[i].nombre, visitante: equipos[j].nombre, golesLocal: null, golesVisitante: null });
    }
  }
  guardar();
  mostrarPartidos();
});

// --- MOSTRAR PARTIDOS ---
function mostrarPartidos() {
  const cont = document.getElementById("listaPartidos");
  cont.innerHTML = "";
  partidos.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("partido");
    div.innerHTML = `
      <strong>${p.local}</strong>
      <input type="number" min="0" class="golesLocal" value="${p.golesLocal ?? ""}" placeholder="0">
      <span>vs</span>
      <input type="number" min="0" class="golesVisitante" value="${p.golesVisitante ?? ""}" placeholder="0">
      <strong>${p.visitante}</strong>
      <button class="guardarResultado" data-i="${i}">Guardar</button>
    `;
    cont.appendChild(div);
  });

  document.querySelectorAll(".guardarResultado").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = e.target.dataset.i;
      const div = e.target.closest(".partido");
      const gl = parseInt(div.querySelector(".golesLocal").value);
      const gv = parseInt(div.querySelector(".golesVisitante").value);
      if (isNaN(gl) || isNaN(gv)) return alert("Ingresa ambos marcadores");
      partidos[i].golesLocal = gl;
      partidos[i].golesVisitante = gv;
      actualizarTabla();
    });
  });
}

// --- TABLA ---
function actualizarTabla() {
  equipos.forEach(eq => tabla[eq.nombre] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, DG: 0, Pts: 0 });
  partidos.forEach(p => {
    if (p.golesLocal == null || p.golesVisitante == null) return;
    const L = tabla[p.local], V = tabla[p.visitante];
    L.PJ++; V.PJ++;
    L.GF += p.golesLocal; L.GC += p.golesVisitante;
    V.GF += p.golesVisitante; V.GC += p.golesLocal;
    if (p.golesLocal > p.golesVisitante) { L.G++; V.P++; L.Pts += 3; }
    else if (p.golesLocal < p.golesVisitante) { V.G++; L.P++; V.Pts += 3; }
    else { L.E++; V.E++; L.Pts++; V.Pts++; }
    L.DG = L.GF - L.GC; V.DG = V.GF - V.GC;
  });
  guardar(); mostrarTabla();
}

function mostrarTabla() {
  const cont = document.getElementById("tablaPosiciones");
  cont.innerHTML = "";
  const ordenados = Object.entries(tabla).sort((a,b)=>b[1].Pts-a[1].Pts||b[1].DG-a[1].DG);
  ordenados.forEach(([n,s])=>{
    const eq = equipos.find(e=>e.nombre===n);
    cont.innerHTML += `
    <tr>
      <td><img src="${eq.logo || './img/default.png'}" class="logoEquipo"></td>
      <td>${n}</td>
      <td>${s.PJ}</td><td>${s.G}</td><td>${s.E}</td><td>${s.P}</td>
      <td>${s.GF}</td><td>${s.GC}</td><td>${s.DG}</td><td>${s.Pts}</td>
    </tr>`;
  });
}

// --- GUARDAR ---
function guardar() {
  localStorage.setItem("equipos", JSON.stringify(equipos));
  localStorage.setItem("partidos", JSON.stringify(partidos));
  localStorage.setItem("tabla", JSON.stringify(tabla));
}

// --- EXPORTAR / IMPORTAR ---
document.getElementById("btnExportar").addEventListener("click", ()=>{
  const data = { equipos, partidos, tabla };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "torneo_valdivia.json";
  a.click();
});

document.getElementById("btnImportar").addEventListener("click", ()=>document.getElementById("inputImportar").click());
document.getElementById("inputImportar").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  const r = new FileReader();
  r.onload = ev=>{
    const data = JSON.parse(ev.target.result);
    equipos = data.equipos; partidos = data.partidos; tabla = data.tabla;
    guardar(); location.reload();
  };
  r.readAsText(file);
});

// --- FONDO ANIMADO (verde y amarillo) ---
const canvas = document.getElementById("fondo");
const ctx = canvas.getContext("2d");
let particles = [];
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
resize(); window.addEventListener("resize",resize);

for(let i=0;i<70;i++){
  particles.push({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height,
    r:Math.random()*3+1,
    dx:(Math.random()-0.5)*1.5,
    dy:(Math.random()-0.5)*1.5,
    color:Math.random()>0.5?"#00ff66":"#ffcc00"
  });
}

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.fillStyle=p.color;
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
    p.x+=p.dx; p.y+=p.dy;
    if(p.x<0||p.x>canvas.width)p.dx*=-1;
    if(p.y<0||p.y>canvas.height)p.dy*=-1;
  });
  requestAnimationFrame(animate);
}
animate();

mostrarPartidos();
mostrarTabla();
