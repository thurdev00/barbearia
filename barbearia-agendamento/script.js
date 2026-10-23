const calendario = document.querySelector("#diasCalendario");
const mesAtual = document.querySelector("#mesAtual");
const botaoMesAnterior = document.querySelector("#mesAnterior");
const botaoProximoMes = document.querySelector("#proximoMes");
const dataSelecionada = document.querySelector("#dataSelecionada");

const hoje = new Date();
let anoExibido = hoje.getFullYear();
let mesExibido = hoje.getMonth();
let dataEscolhida = null;

function getBloqueiosBarbeiro() {
  return JSON.parse(localStorage.getItem("horariosBloqueados") || "{}");
}
function getAgendaLiberadaAte() {
  const salvo = localStorage.getItem("agendaLiberadaAte");
  return salvo ? new Date(salvo) : null;
}
function getLimiteDaSemana() {
  const salvo = getAgendaLiberadaAte();
  if (salvo) return salvo;
  const hojeTemp = new Date();
  const diasAteSabado = 6 - hojeTemp.getDay();
  const sabado = new Date(hojeTemp);
  sabado.setDate(hojeTemp.getDate() + diasAteSabado);
  sabado.setHours(23,59,59,999);
  return sabado;
}

const feriadosBloqueados = [
  "2025-01-01","2025-04-18","2025-04-20","2025-04-21","2025-05-01","2025-06-19","2025-09-07","2025-10-12","2025-11-02","2025-11-15","2025-11-20","2025-12-25",
  "2026-01-01","2026-02-16","2026-02-17","2026-04-03","2026-04-05","2026-04-21","2026-05-01","2026-06-04","2026-09-07","2026-10-12","2026-11-02","2026-11-15","2026-11-20","2026-12-25",
];
function ehFeriado(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return feriadosBloqueados.includes(`${ano}-${mes}-${dia}`);
}

function gerarCalendario() {
    calendario.innerHTML = "";
    const primeiroDia = new Date(anoExibido, mesExibido, 1);
    const ultimoDia = new Date(anoExibido, mesExibido + 1, 0);
    const nomeMes = primeiroDia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    mesAtual.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

    for (let i = 0; i < primeiroDia.getDay(); i++) {
        const espaco = document.createElement("span");
        espaco.classList.add("espaco-calendario");
        calendario.appendChild(espaco);
    }

    const limiteSemana = getLimiteDaSemana();
    const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = dia;
        const dataDoDia = new Date(anoExibido, mesExibido, dia);
        const ehDomingo = dataDoDia.getDay() === 0;

        if (dataDoDia.getTime() === hojeZerado.getTime()) botao.classList.add("hoje");
        if (ehDomingo) {
            botao.classList.add("domingo"); botao.disabled = true;
            calendario.appendChild(botao); continue;
        }
        if (ehFeriado(dataDoDia)) {
            botao.classList.add("feriado"); botao.disabled = true;
            calendario.appendChild(botao); continue;
        }
        if (dataDoDia < hojeZerado || dataDoDia > limiteSemana) {
            botao.disabled = true;
            botao.style.opacity = dataDoDia < hojeZerado ? "0.3" : "0.15";
            botao.title = dataDoDia > limiteSemana ? "Agenda ainda não liberada" : "";
        }
        if (dataEscolhida && dataDoDia.toDateString() === dataEscolhida.toDateString()) {
            botao.classList.add("selecionado");
        }
        botao.addEventListener("click", function () {
            if (botao.disabled) return;
            dataEscolhida = dataDoDia;
            dataSelecionada.textContent = dataEscolhida.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            gerarCalendario();
            setTimeout(aplicarBloqueiosNaTela, 10);
        });
        calendario.appendChild(botao);
    }

    botaoMesAnterior.disabled = anoExibido === hoje.getFullYear() && mesExibido === hoje.getMonth();
    botaoMesAnterior.style.opacity = botaoMesAnterior.disabled ? "0.3" : "1";

    const limiteMesAno = limiteSemana.getFullYear() * 12 + limiteSemana.getMonth();
    const atualMesAno = anoExibido * 12 + mesExibido;
    botaoProximoMes.disabled = atualMesAno >= limiteMesAno;
    botaoProximoMes.style.opacity = botaoProximoMes.disabled ? "0.3" : "1";
}

botaoMesAnterior.addEventListener("click", function () {
    if(this.disabled) return;
    mesExibido--; if (mesExibido < 0) { mesExibido = 11; anoExibido--; }
    gerarCalendario();
});
botaoProximoMes.addEventListener("click", function () {
    if(this.disabled) return;
    mesExibido++; if (mesExibido > 11) { mesExibido = 0; anoExibido++; }
    gerarCalendario();
});

gerarCalendario();

function aplicarBloqueiosNaTela() {
  if (!dataEscolhida) return;
  const chave = `${dataEscolhida.getFullYear()}-${String(dataEscolhida.getMonth()+1).padStart(2,'0')}-${String(dataEscolhida.getDate()).padStart(2,'0')}`;
  const bloqueadosDoDia = getBloqueiosBarbeiro()[chave] || [];
  
  // pega agendamentos já feitos nesse dia
  const agendamentos = JSON.parse(localStorage.getItem("agendamentos") || "[]");
  const ocupados = agendamentos.filter(a => a.data === chave).map(a => a.hora);

  document.querySelectorAll(".lista-horarios button").forEach(btn => {
    btn.disabled = false; btn.style.opacity = "1"; btn.style.textDecoration = "none";
    btn.classList.remove("ocupado"); btn.classList.add("livre");
    const hora = btn.textContent.trim();
    if (bloqueadosDoDia.includes(hora) || ocupados.includes(hora)) {
      btn.disabled = true; btn.style.opacity = "0.2"; btn.style.textDecoration = "line-through";
      btn.classList.remove("livre"); btn.classList.add("ocupado");
    }
  });
}

const horarios = document.querySelectorAll(".lista-horarios button");
horarios.forEach(h => h.addEventListener("click", function() {
    if (this.disabled) return;
    horarios.forEach(i => i.classList.remove("horario-selecionado"));
    this.classList.add("horario-selecionado");
}));
const botoesServicos = document.querySelectorAll(".servico");
botoesServicos.forEach(s => s.addEventListener("click", function() {
    botoesServicos.forEach(i => i.classList.remove("selecionado"));
    s.classList.add("selecionado");
}));

document.querySelector("#confirmarAgendamento").addEventListener("click", function() {
    const nome = document.querySelector("#nomeCliente").value.trim();
    const sobrenome = document.querySelector("#sobrenomeCliente").value.trim();
    const whatsapp = document.querySelector("#whatsappCliente").value.trim();
    const horarioSelecionado = document.querySelector(".lista-horarios .horario-selecionado");
    const servicoSelecionado = document.querySelector(".servico.selecionado");
    if (!dataEscolhida) return alert("Escolha uma data.");
    if (!horarioSelecionado) return alert("Escolha um horário.");
    if (!servicoSelecionado) return alert("Escolha um serviço.");
    if (!nome || !sobrenome || !whatsapp) return alert("Preencha seus dados.");
    const nomeServico = servicoSelecionado.children[0].textContent.trim();
    const precoServico = servicoSelecionado.children[1].textContent.trim();
    const dataFormatada = dataEscolhida.toLocaleDateString("pt-BR");
    const chaveData = `${dataEscolhida.getFullYear()}-${String(dataEscolhida.getMonth()+1).padStart(2,'0')}-${String(dataEscolhida.getDate()).padStart(2,'0')}`;
    const hora = horarioSelecionado.textContent.trim();

    // SALVA NO SISTEMA PARA APARECER NO ADMIN
    const lista = JSON.parse(localStorage.getItem("agendamentos") || "[]");
    lista.push({
      data: chaveData,
      hora: hora,
      nome: nome + " " + sobrenome,
      telefone: whatsapp,
      servico: nomeServico,
      preco: precoServico,
      dataFormatada: dataFormatada
    });
    localStorage.setItem("agendamentos", JSON.stringify(lista));

    const msg = `Olá! Gostaria de confirmar meu agendamento.\n\nNome: ${nome} ${sobrenome}\nTelefone: ${whatsapp}\nData: ${dataFormatada}\nHorário: ${hora}\nServiço: ${nomeServico}\nPreço: ${precoServico}`;
    window.open("https://wa.me/5511993572693?text=" + encodeURIComponent(msg), "_blank");
    
    setTimeout(() => {
      alert("Agendamento salvo! Agora aparece no seu painel.");
      aplicarBloqueiosNaTela();
    }, 500);
});