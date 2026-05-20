"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ViewMode = "menu" | "aluno" | "alunos" | "escola" | "escolas" | "financeiro" | "tarefas" | "usuarios";

type Aluno = {
  id: number;
  nome: string;
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
  telefone?: string;
  escola?: string;
  turma?: string;
  formaPagamento?: string;
  valorContrato?: number;
  valorRestanteContrato?: number;
  valorMensal?: number;
  parcelas?: number;
  status?: string;
  baile?: boolean;
  kitFormatura?: boolean;
  placaHomenagem?: boolean;
  quantidadePlacaHomenagem?: number;
  placaReplica?: boolean;
  quantidadePlacaReplica?: number;
};

type Pagamento = {
  id: number;
  aluno?: Aluno;
  nomeAluno?: string;
  valor: number;
  numeroParcela?: number;
  dataPagamento?: string;
};

type Escola = {
  id: number;
  nomeEscola: string;
  responsavel?: string;
  telefoneResponsavel?: string;
  dataBaileFormatura?: string;
  mesInicioPagamento?: string;
  dataLimiteContrato?: string;
  quantidadeConvitesContrato?: number;
  quantidadeSenhasExtras?: number;
  valorSenhaExtra?: number;
  valorBaile?: number;
  valorKitFormatura?: number;
  valorPlacaReplica?: number;
  valorPlacaHomenagem?: number;
};

type ComissaoFormatura = {
  id: number;
  escolaId: number;
  nomeEscola?: string;
  alunoId: number;
  nomeAluno?: string;
  nomeResponsavel?: string;
  turma?: string;
  valorContratoOriginal?: number;
  desconto?: number;
  valorContratoComDesconto?: number;
};

type Demanda = {
  id: number;
  titulo: string;
  aluno?: string;
  departamento: string;
  responsavel: string;
  prazo: string;
  comentarios: string[];
  anexos: string[];
  prioridade: string;
  status: string;
};

type HealthStatus = {
  serverOnline: boolean;
  databaseOnline: boolean;
  checked: boolean;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function Home() {
  const [view, setView] = useState<ViewMode>("menu");
  const [authChecked] = useState(true);
  const [authHeader, setAuthHeader] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("trAuthHeader") || ""));
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");
  const [loginCarregando, setLoginCarregando] = useState(false);
  const [alunoForm, setAlunoForm] = useState({
    nome: "",
    nomeResponsavel: "",
    telefoneResponsavel: "",
    telefone: "",
    escolaId: "",
    escola: "",
    turma: "",
    formaPagamento: "",
    parcelas: "",
    baile: false,
    kitFormatura: false,
    placaHomenagem: false,
    quantidadePlacaHomenagem: "1",
    placaReplica: false,
    quantidadePlacaReplica: "1"
  });
  const [escolaForm, setEscolaForm] = useState({
    nomeEscola: "",
    responsavel: "",
    telefoneResponsavel: "",
    dataBaileFormatura: "",
    mesInicioPagamento: "",
    dataLimiteContrato: "",
    quantidadeConvitesContrato: "",
    quantidadeSenhasExtras: "",
    valorSenhaExtra: "",
    valorBaile: "",
    valorKitFormatura: "",
    valorPlacaReplica: "",
    valorPlacaHomenagem: ""
  });
  const [search, setSearch] = useState({ nome: "", responsavel: "", escola: "" });
  const [resultadoBuscaVisivel, setResultadoBuscaVisivel] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [pagamento, setPagamento] = useState({ alunoId: "", valor: "" });
  const [numeroParcela, setNumeroParcela] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [ultimoPagamento, setUltimoPagamento] = useState<Pagamento | null>(null);
  const [mostrarComissao, setMostrarComissao] = useState(false);
  const [comissaoForm, setComissaoForm] = useState({ escolaId: "", alunoId: "", desconto: "" });
  const [comissaoFormatura, setComissaoFormatura] = useState<ComissaoFormatura[]>([]);
  const [escolaDetalhe, setEscolaDetalhe] = useState<Escola | null>(null);
  const [alunoDetalhe, setAlunoDetalhe] = useState<Aluno | null>(null);
  const [alunoFinanceiro, setAlunoFinanceiro] = useState<Aluno | null>(null);
  const [pagamentosFinanceiro, setPagamentosFinanceiro] = useState<Pagamento[]>([]);
  const [comissaoAlunoDetalhe, setComissaoAlunoDetalhe] = useState<ComissaoFormatura | null>(null);
  const [alunoEscolaFiltro, setAlunoEscolaFiltro] = useState("");
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const [escolaEditando, setEscolaEditando] = useState<Escola | null>(null);
  const [mostrarAlunosEscola, setMostrarAlunosEscola] = useState(false);
  const [departamentoAtivo, setDepartamentoAtivo] = useState("Administração");
  const [filtroParcela, setFiltroParcela] = useState("todos");
  const [financeiroBusca, setFinanceiroBusca] = useState({ nome: "", responsavel: "", escola: "" });
  const [financeiroResultados, setFinanceiroResultados] = useState<Aluno[]>([]);
  const [financeiroBuscaRealizada, setFinanceiroBuscaRealizada] = useState(false);
  const [demandaSelecionadaId, setDemandaSelecionadaId] = useState<number | null>(null);
  const [comentarioDemanda, setComentarioDemanda] = useState("");
  const [demandaRemovida, setDemandaRemovida] = useState<Demanda | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    serverOnline: false,
    databaseOnline: false,
    checked: false
  });
  const [demandasInternas, setDemandasInternas] = useState<Demanda[]>([
    {
      id: 1,
      titulo: "Aluno pediu segunda via do contrato",
      departamento: "Contratos",
      responsavel: "Carla Admin",
      prazo: "2026-05-22",
      comentarios: ["Gerar segunda via e enviar por e-mail."],
      anexos: [],
      prioridade: "media",
      status: "aberta"
    },
    {
      id: 2,
      titulo: "Aluno enviou comprovante",
      departamento: "Financeiro",
      responsavel: "Ana Financeiro",
      prazo: "2026-05-20",
      comentarios: ["Conferir valor parcial recebido."],
      anexos: ["entrada-rafael.jpg"],
      prioridade: "alta",
      status: "em andamento"
    },
    {
      id: 3,
      titulo: "Aluno pediu cancelamento",
      departamento: "Distratos",
      responsavel: "Bruno Atendimento",
      prazo: "2026-05-24",
      comentarios: ["Validar contrato antes de iniciar distrato."],
      anexos: [],
      prioridade: "urgente",
      status: "aberta"
    }
  ]);

  const indicadores = useMemo(() => {
    return {
      totalAlunos: alunos.length,
      totalEscolas: escolas.length
    };
  }, [alunos, escolas]);

  const escolaSelecionada = useMemo(
    () => escolas.find((escola) => escola.id.toString() === alunoForm.escolaId),
    [alunoForm.escolaId, escolas]
  );
  const valorContratoAluno = useMemo(() => {
    const quantidadePlaca = alunoForm.placaHomenagem ? Math.max(parseInt(alunoForm.quantidadePlacaHomenagem || "1"), 1) : 0;
    const quantidadeReplica = alunoForm.placaReplica ? Math.max(parseInt(alunoForm.quantidadePlacaReplica || "1"), 1) : 0;
    return (
      (alunoForm.baile ? Number(escolaSelecionada?.valorBaile || 0) : 0) +
      (alunoForm.kitFormatura ? Number(escolaSelecionada?.valorKitFormatura || 0) : 0) +
      (alunoForm.placaHomenagem ? Number(escolaSelecionada?.valorPlacaHomenagem || 0) * quantidadePlaca : 0) +
      (alunoForm.placaReplica ? Number(escolaSelecionada?.valorPlacaReplica || 0) * quantidadeReplica : 0)
    );
  }, [alunoForm.baile, alunoForm.kitFormatura, alunoForm.placaHomenagem, alunoForm.placaReplica, alunoForm.quantidadePlacaHomenagem, alunoForm.quantidadePlacaReplica, escolaSelecionada]);
  const valorMensalPreview = valorContratoAluno && alunoForm.parcelas
    ? (valorContratoAluno / parseInt(alunoForm.parcelas)).toFixed(2)
    : "0.00";
  const valorTotalContrato = Number(alunoSelecionado?.valorContrato || 0);
  const valorRestanteContrato = Number(alunoSelecionado?.valorRestanteContrato ?? alunoSelecionado?.valorContrato ?? 0);
  const escolaComissao = useMemo(
    () => escolas.find((escola) => escola.id.toString() === comissaoForm.escolaId),
    [comissaoForm.escolaId, escolas]
  );
  const alunosDaEscolaComissao = useMemo(
    () => alunos.filter((aluno) => aluno.escola === escolaComissao?.nomeEscola),
    [alunos, escolaComissao]
  );
  const alunoComissao = useMemo(
    () => alunos.find((aluno) => aluno.id.toString() === comissaoForm.alunoId),
    [alunos, comissaoForm.alunoId]
  );
  const valorComDescontoPreview = Math.max(Number(alunoComissao?.valorContrato || 0) - parseMoney(comissaoForm.desconto), 0);
  const alunosFiltradosOrdenados = useMemo(() => {
    return alunos
      .filter((aluno) => !alunoEscolaFiltro || aluno.escola === alunoEscolaFiltro)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [alunos, alunoEscolaFiltro]);
  const alunosDaEscolaDetalhe = useMemo(() => {
    return alunos
      .filter((aluno) => aluno.escola === escolaDetalhe?.nomeEscola)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [alunos, escolaDetalhe]);
  const financeiroResumo = useMemo(() => {
    const contratado = alunos.reduce((total, aluno) => total + Number(aluno.valorContrato || 0), 0);
    const valorEmAberto = alunos.reduce((total, aluno) => {
      const restante = Number(aluno.valorRestanteContrato ?? aluno.valorContrato ?? 0);
      return restante > 0 ? total + restante : total;
    }, 0);
    const valorPago = alunos.reduce((total, aluno) => {
      const contrato = Number(aluno.valorContrato || 0);
      const restante = Number(aluno.valorRestanteContrato ?? aluno.valorContrato ?? 0);
      return contrato > 0 && restante <= 0 ? total + contrato : total;
    }, 0);
    const emAberto = alunos.filter((aluno) => Number(aluno.valorRestanteContrato ?? aluno.valorContrato ?? 0) > 0).length;
    const pagos = alunos.filter((aluno) => Number(aluno.valorContrato || 0) > 0 && Number(aluno.valorRestanteContrato ?? aluno.valorContrato ?? 0) <= 0).length;

    return {
      contratado,
      valorEmAberto,
      valorPago,
      emAberto,
      pagos
    };
  }, [alunos]);
  const demandasComAluno = useMemo(() => {
    return demandasInternas.map((demanda, index) => ({
      ...demanda,
      aluno: demanda.aluno || alunos[index]?.nome || alunos[0]?.nome || "Aluno"
    })).filter((demanda) => demanda.status !== "concluida");
  }, [alunos, demandasInternas]);
  const parcelasFinanceiro = useMemo(() => {
    return alunos.map((aluno) => {
      const restante = Number(aluno.valorRestanteContrato ?? aluno.valorContrato ?? 0);
      const contratado = Number(aluno.valorContrato || 0);
      const status = restante <= 0 ? "pago" : restante < contratado ? "parcial" : "pendente";
      return {
        aluno,
        numero: 1,
        vencimento: "-",
        valor: Number(aluno.valorMensal || restante || contratado || 0),
        comprovante: status === "pago" ? "Registrado" : "Pendente",
        status
      };
    }).filter((item) => filtroParcela === "todos" || item.status === filtroParcela);
  }, [alunos, filtroParcela]);
  const navItems = [
    { id: "menu" as ViewMode, label: "Painel inicial", helper: "Resumo geral", action: () => setView("menu") },
    { id: "alunos" as ViewMode, label: "Alunos", helper: "Cadastro e consulta", action: () => { setView("alunos"); setAlunoDetalhe(null); setAlunoEscolaFiltro(""); setResultadoBuscaVisivel(false); listarTodos(); listarEscolas(); } },
    { id: "escolas" as ViewMode, label: "Turmas/Eventos", helper: "Escolas, turmas e valores", action: () => { setView("escolas"); setEscolaDetalhe(null); listarEscolas(); } },
    { id: "financeiro" as ViewMode, label: "Financeiro", helper: "Pagamentos, resumo e recibos", action: () => { setView("financeiro"); listarTodos(); listarEscolas(); } },
    { id: "tarefas" as ViewMode, label: "Tarefas", helper: "Rotinas internas", action: () => setView("tarefas") },
    { id: "usuarios" as ViewMode, label: "Usuários e permissões", helper: "Acessos", action: () => setView("usuarios") }
  ];
  const titulosView: Record<ViewMode, { label: string; helper: string }> = {
    menu: { label: "Painel inicial", helper: "Visao geral do sistema antigo dentro do novo layout." },
    aluno: { label: "Cadastro de aluno", helper: "Dados do aluno, responsavel, contrato, servicos e parcelas." },
    alunos: { label: "Alunos", helper: "Consulta, edicao, resumo financeiro e recibos." },
    escola: { label: "Cadastro de escola", helper: "Dados da escola, turma/evento, senhas e valores dos servicos." },
    escolas: { label: "Turmas/Eventos", helper: "Consulta de escolas, turmas/eventos, alunos vinculados e comissao." },
    financeiro: { label: "Financeiro", helper: "Pagamentos, resumo financeiro e gerador de recibo do sistema antigo." },
    tarefas: { label: "Tarefas", helper: "Rotinas internas do novo layout, sem dados ficticios." },
    usuarios: { label: "Usuarios e permissoes", helper: "Controle visual de acessos para completar o menu do sistema interno." }
  };
  const currentNav = titulosView[view];
  const infraOnline = healthStatus.serverOnline && healthStatus.databaseOnline;
  const totalTarefasAbertas = demandasInternas.filter((demanda) => demanda.status !== "concluida").length;
  const totalUsuarios = 0;
  const dataPainel = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).replace(/\b\w/g, (letra) => letra.toUpperCase()),
    []
  );

  function moeda(valor?: number | string) {
    const numero = Number(valor || 0);
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function parseMoney(valor: string) {
    return valor ? parseFloat(valor) : 0;
  }

  function gerarAuthHeader(email: string, senha: string) {
    return `Basic ${window.btoa(`${email.trim()}:${senha}`)}`;
  }

  async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }

    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
      sair();
      alert("Sua sessão expirou. Faça login novamente.");
    }
    return response;
  }

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginErro("");

    if (!loginForm.email.trim() || !loginForm.senha) {
      setLoginErro("Informe e-mail e senha.");
      return;
    }

    setLoginCarregando(true);
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, senha: loginForm.senha })
      });

      if (!response.ok) {
        setLoginErro(response.status === 503 ? "Login do sistema nao configurado no backend." : "Login ou senha invalido.");
        return;
      }

      const header = gerarAuthHeader(loginForm.email, loginForm.senha);
      window.localStorage.setItem("trAuthHeader", header);
      setAuthHeader(header);
      setLoginForm({ email: "", senha: "" });
    } catch {
      setLoginErro("Nao foi possivel conectar ao servidor da API.");
    } finally {
      setLoginCarregando(false);
    }
  }

  function sair() {
    window.localStorage.removeItem("trAuthHeader");
    setAuthHeader("");
    setAlunos([]);
    setEscolas([]);
    setAlunoSelecionado(null);
    setAlunoDetalhe(null);
    setAlunoFinanceiro(null);
    setPagamentos([]);
    setPagamentosFinanceiro([]);
  }

  async function executarBackup() {
    alert("Backup local/manual. Execute no servidor: backend/scripts/backup-trcrm.ps1");
  }

  function alunoEstaInadimplente(aluno: Aluno) {
    return (aluno.status || "").toLowerCase() === "inadimplente";
  }

  function atualizarStatusDemanda(id: number, status: string) {
    setDemandasInternas((demandas) => {
      if (status === "concluida") {
        setDemandaSelecionadaId((atual) => (atual === id ? null : atual));
        return demandas.filter((demanda) => demanda.id !== id);
      }
      return demandas.map((demanda) => (demanda.id === id ? { ...demanda, status } : demanda));
    });
  }

  function removerDemanda(id: number) {
    const confirmar = window.confirm("Deseja apagar esta tarefa?");
    if (!confirmar) return;
    setDemandasInternas((demandas) => {
      const alvo = demandas.find((demanda) => demanda.id === id) || null;
      setDemandaRemovida(alvo);
      return demandas.filter((demanda) => demanda.id !== id);
    });
    setDemandaSelecionadaId((atual) => (atual === id ? null : atual));
  }

  function desfazerRemocaoDemanda() {
    if (!demandaRemovida) return;
    setDemandasInternas((demandas) => [demandaRemovida, ...demandas]);
    setDemandaRemovida(null);
  }

  function adicionarComentarioDemanda() {
    const comentario = comentarioDemanda.trim();
    if (!demandaSelecionadaId || !comentario) return;

    setDemandasInternas((demandas) =>
      demandas.map((demanda) =>
        demanda.id === demandaSelecionadaId
          ? { ...demanda, comentarios: [...demanda.comentarios, comentario] }
          : demanda
      )
    );
    setComentarioDemanda("");
  }

  function resetAlunoForm() {
    setAlunoForm({ nome: "", nomeResponsavel: "", telefoneResponsavel: "", telefone: "", escolaId: "", escola: "", turma: "", formaPagamento: "", parcelas: "", baile: false, kitFormatura: false, placaHomenagem: false, quantidadePlacaHomenagem: "1", placaReplica: false, quantidadePlacaReplica: "1" });
    setAlunoEditando(null);
  }

  function resetEscolaForm() {
    setEscolaForm({
      nomeEscola: "",
      responsavel: "",
      telefoneResponsavel: "",
      dataBaileFormatura: "",
      mesInicioPagamento: "",
      dataLimiteContrato: "",
      quantidadeConvitesContrato: "",
      quantidadeSenhasExtras: "",
      valorSenhaExtra: "",
      valorBaile: "",
      valorKitFormatura: "",
      valorPlacaReplica: "",
      valorPlacaHomenagem: ""
    });
    setEscolaEditando(null);
  }

  function formatarData(data?: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
  }

  function formatarMes(mesAno?: string) {
    if (!mesAno) return "-";
    const [ano, mes] = mesAno.split("-");
    if (!ano || !mes) return mesAno;
    return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  function linkWhatsApp(telefone: string | undefined, mensagem: string) {
    const numero = (telefone || "").replace(/\D/g, "");
    const numeroComPais = numero.length > 0 && !numero.startsWith("55") ? `55${numero}` : numero;
    return `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`;
  }

  function buscarEscolaDoAluno(aluno: Aluno) {
    return escolas.find((escola) => escola.nomeEscola === aluno.escola);
  }

  function servicosDoAluno(aluno: Aluno) {
    const escola = buscarEscolaDoAluno(aluno);
    const servicos = [];
    if (aluno.baile) servicos.push({ nome: "Baile", quantidade: 1, valorUnitario: Number(escola?.valorBaile || 0) });
    if (aluno.kitFormatura) servicos.push({ nome: "Kit Formatura", quantidade: 1, valorUnitario: Number(escola?.valorKitFormatura || 0) });
    if (aluno.placaReplica) servicos.push({ nome: "Placa replica", quantidade: Number(aluno.quantidadePlacaReplica || 1), valorUnitario: Number(escola?.valorPlacaReplica || 0) });
    if (aluno.placaHomenagem) servicos.push({ nome: "Placa de homenagem", quantidade: Number(aluno.quantidadePlacaHomenagem || 1), valorUnitario: Number(escola?.valorPlacaHomenagem || 0) });
    return servicos;
  }

  async function salvarAluno() {
    if (!infraOnline) {
      alert("Nao foi possivel salvar. Servidor ou banco de dados offline.");
      return;
    }

    if (!escolaSelecionada) {
      alert("Cadastre e selecione uma escola antes de cadastrar o aluno.");
      return;
    }

    const valorPago = alunoEditando
      ? Math.max(Number(alunoEditando.valorContrato || 0) - Number(alunoEditando.valorRestanteContrato ?? alunoEditando.valorContrato ?? 0), 0)
      : 0;
    const valorRestanteAtualizado = alunoEditando
      ? Math.max(valorContratoAluno - valorPago, 0)
      : valorContratoAluno;
    const dataToSave = {
      ...alunoForm,
      escola: escolaSelecionada.nomeEscola,
      valorContrato: valorContratoAluno,
      valorRestanteContrato: valorRestanteAtualizado,
      parcelas: alunoForm.parcelas ? parseInt(alunoForm.parcelas) : 0,
      valorMensal: Number(valorMensalPreview),
      baile: alunoForm.baile,
      kitFormatura: alunoForm.kitFormatura,
      placaHomenagem: alunoForm.placaHomenagem,
      quantidadePlacaHomenagem: alunoForm.placaHomenagem ? parseInt(alunoForm.quantidadePlacaHomenagem || "1") : 0,
      placaReplica: alunoForm.placaReplica,
      quantidadePlacaReplica: alunoForm.placaReplica ? parseInt(alunoForm.quantidadePlacaReplica || "1") : 0
    };
    delete (dataToSave as Record<string, unknown>).escolaId;

    const response = await apiFetch(alunoEditando ? `${apiUrl}/alunos/${alunoEditando.id}` : `${apiUrl}/alunos`, {
      method: alunoEditando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave)
    });
    if (!response.ok) {
      alert(alunoEditando ? "Nao foi possivel editar o aluno." : "Nao foi possivel cadastrar o aluno.");
      return;
    }

    alert(alunoEditando ? "Aluno atualizado!" : "Aluno cadastrado!");
    resetAlunoForm();
    listarTodos();
  }

  async function salvarEscola() {
    if (!infraOnline) {
      alert("Nao foi possivel salvar. Servidor ou banco de dados offline.");
      return;
    }

    if (!escolaForm.nomeEscola) {
      alert("Informe o nome da escola.");
      return;
    }

    const dataToSave = {
      nomeEscola: escolaForm.nomeEscola,
      responsavel: escolaForm.responsavel,
      telefoneResponsavel: escolaForm.telefoneResponsavel,
      dataBaileFormatura: escolaForm.dataBaileFormatura,
      mesInicioPagamento: escolaForm.mesInicioPagamento,
      dataLimiteContrato: escolaForm.dataLimiteContrato,
      quantidadeConvitesContrato: escolaForm.quantidadeConvitesContrato ? parseInt(escolaForm.quantidadeConvitesContrato) : 0,
      quantidadeSenhasExtras: escolaForm.quantidadeSenhasExtras ? parseInt(escolaForm.quantidadeSenhasExtras) : 0,
      valorSenhaExtra: parseMoney(escolaForm.valorSenhaExtra),
      valorBaile: parseMoney(escolaForm.valorBaile),
      valorKitFormatura: parseMoney(escolaForm.valorKitFormatura),
      valorPlacaReplica: parseMoney(escolaForm.valorPlacaReplica),
      valorPlacaHomenagem: parseMoney(escolaForm.valorPlacaHomenagem)
    };

    const response = await apiFetch(escolaEditando ? `${apiUrl}/escolas/${escolaEditando.id}` : `${apiUrl}/escolas`, {
      method: escolaEditando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave)
    });
    if (!response.ok) {
      alert(escolaEditando ? "Nao foi possivel editar a escola." : "Nao foi possivel cadastrar a escola.");
      return;
    }

    alert(escolaEditando ? "Escola atualizada!" : "Escola cadastrada!");
    resetEscolaForm();
    listarEscolas();
  }

  async function pesquisar() {
    const params = new URLSearchParams();
    if (search.nome) params.append("nome", search.nome);
    if (search.responsavel) params.append("responsavel", search.responsavel);
    if (search.escola) params.append("escola", search.escola);
    if (!params.toString()) {
      alert("Preencha nome do aluno, responsavel ou escola para pesquisar.");
      return;
    }
    const response = await apiFetch(`${apiUrl}/alunos${params.toString() ? `?${params.toString()}` : ""}`);
    setAlunos(await response.json());
    setResultadoBuscaVisivel(true);
  }

  async function listarTodos() {
    const response = await apiFetch(`${apiUrl}/alunos`);
    setAlunos(await response.json());
  }

  async function listarBusca() {
    await listarTodos();
    setResultadoBuscaVisivel(true);
  }

  async function limparBusca() {
    setSearch({ nome: "", responsavel: "", escola: "" });
    setResultadoBuscaVisivel(false);
    fecharFinanceiroAluno();
    await listarTodos();
  }

  async function listarEscolas() {
    const response = await apiFetch(`${apiUrl}/escolas`);
    setEscolas(await response.json());
  }

  async function carregarSaudeInfra() {
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (!response.ok) {
        setHealthStatus({ serverOnline: false, databaseOnline: false, checked: true });
        return;
      }

      const data = await response.json();
      setHealthStatus({
        serverOnline: Boolean(data.serverOnline),
        databaseOnline: Boolean(data.databaseOnline),
        checked: true
      });
    } catch {
      setHealthStatus({ serverOnline: false, databaseOnline: false, checked: true });
    }
  }

  useEffect(() => {
    if (!authHeader) return;

    listarTodos();
    listarEscolas();
    const initialHealthCheck = window.setTimeout(() => {
      carregarSaudeInfra();
    }, 0);

    const interval = window.setInterval(() => {
      carregarSaudeInfra();
    }, 30000);

    return () => {
      window.clearTimeout(initialHealthCheck);
      window.clearInterval(interval);
    };
  }, [authHeader]);

  async function buscarAlunoFinanceiro() {
    const params = new URLSearchParams();
    if (financeiroBusca.nome.trim()) params.append("nome", financeiroBusca.nome.trim());
    if (financeiroBusca.responsavel.trim()) params.append("responsavel", financeiroBusca.responsavel.trim());
    if (financeiroBusca.escola.trim()) params.append("escola", financeiroBusca.escola.trim());

    if (!params.toString()) {
      alert("Preencha nome do aluno, responsavel ou escola para buscar.");
      return;
    }

    setFinanceiroBuscaRealizada(true);
    try {
      const response = await apiFetch(`${apiUrl}/alunos?${params.toString()}`);
      if (response.ok) {
        setFinanceiroResultados(await response.json());
        return;
      }
    } catch {
      // Usa a lista local caso a API esteja indisponivel.
    }

    const nome = financeiroBusca.nome.trim().toLowerCase();
    const responsavel = financeiroBusca.responsavel.trim().toLowerCase();
    const escola = financeiroBusca.escola.trim().toLowerCase();
    setFinanceiroResultados(
      alunos.filter((aluno) => {
        const nomeOk = !nome || (aluno.nome || "").toLowerCase().includes(nome);
        const responsavelOk = !responsavel || (aluno.nomeResponsavel || "").toLowerCase().includes(responsavel);
        const escolaOk = !escola || (aluno.escola || "").toLowerCase().includes(escola);
        return nomeOk && responsavelOk && escolaOk;
      })
    );
  }

  async function abrirComissao() {
    setMostrarComissao(true);
    await Promise.all([listarEscolas(), listarTodos()]);
  }

  async function carregarComissao(escolaId: string) {
    if (!escolaId) {
      setComissaoFormatura([]);
      return;
    }

    const response = await apiFetch(`${apiUrl}/comissao-formatura/escola/${escolaId}`);
    if (!response.ok) {
      alert("Nao foi possivel consultar a comissao desta escola.");
      return;
    }
    setComissaoFormatura(await response.json());
  }

  async function abrirAlunoDetalhe(aluno: Aluno) {
    setAlunoDetalhe(aluno);
    setAlunoFinanceiro(null);
    setComissaoAlunoDetalhe(null);

    const response = await apiFetch(`${apiUrl}/comissao-formatura/aluno/${aluno.id}`);
    if (!response.ok) return;

    const comissoes = await response.json();
    setComissaoAlunoDetalhe(comissoes[0] || null);
  }

  function abrirEscolaDoAluno(aluno: Aluno) {
    const escolaAluno = escolas.find((escola) => escola.nomeEscola === aluno.escola);
    if (!escolaAluno) {
      alert("Escola deste aluno nao encontrada.");
      return;
    }

    setEscolaDetalhe(escolaAluno);
    setMostrarAlunosEscola(false);
    setView("escolas");
  }

  async function abrirFinanceiroAluno(aluno: Aluno) {
    selecionarAlunoParaPagamento(aluno);
    setAlunoFinanceiro(aluno);
    setPagamentosFinanceiro([]);
    setView("financeiro");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const response = await apiFetch(`${apiUrl}/pagamentos/aluno/${aluno.id}`);
      if (!response.ok) {
        alert("Nao foi possivel carregar os pagamentos deste aluno. O resumo do contrato foi aberto mesmo assim.");
        return;
      }

      const pagamentosAluno: Pagamento[] = await response.json();
      setPagamentosFinanceiro(
        pagamentosAluno.sort((a, b) => Number(a.numeroParcela || a.id || 0) - Number(b.numeroParcela || b.id || 0))
      );
    } catch {
      alert("Nao foi possivel conectar ao servidor de pagamentos. O resumo do contrato foi aberto mesmo assim.");
    }
  }

  function fecharFinanceiroAluno() {
    setAlunoFinanceiro(null);
    setPagamentosFinanceiro([]);
  }

  function editarAluno(aluno: Aluno) {
    const escolaDoAluno = escolas.find((escola) => escola.nomeEscola === aluno.escola);
    setAlunoEditando(aluno);
    setAlunoDetalhe(null);
    setComissaoAlunoDetalhe(null);
    setAlunoForm({
      nome: aluno.nome || "",
      nomeResponsavel: aluno.nomeResponsavel || "",
      telefoneResponsavel: aluno.telefoneResponsavel || "",
      telefone: aluno.telefone || "",
      escolaId: escolaDoAluno?.id.toString() || "",
      escola: aluno.escola || "",
      turma: aluno.turma || "",
      formaPagamento: aluno.formaPagamento || "",
      parcelas: aluno.parcelas ? aluno.parcelas.toString() : "",
      baile: Boolean(aluno.baile),
      kitFormatura: Boolean(aluno.kitFormatura),
      placaHomenagem: Boolean(aluno.placaHomenagem),
      quantidadePlacaHomenagem: aluno.quantidadePlacaHomenagem ? aluno.quantidadePlacaHomenagem.toString() : "1",
      placaReplica: Boolean(aluno.placaReplica),
      quantidadePlacaReplica: aluno.quantidadePlacaReplica ? aluno.quantidadePlacaReplica.toString() : "1"
    });
    setView("aluno");
    listarEscolas();
  }

  function editarEscola(escola: Escola) {
    setEscolaEditando(escola);
    setEscolaDetalhe(null);
    setEscolaForm({
      nomeEscola: escola.nomeEscola || "",
      responsavel: escola.responsavel || "",
      telefoneResponsavel: escola.telefoneResponsavel || "",
      dataBaileFormatura: escola.dataBaileFormatura || "",
      mesInicioPagamento: escola.mesInicioPagamento || "",
      dataLimiteContrato: escola.dataLimiteContrato || "",
      quantidadeConvitesContrato: escola.quantidadeConvitesContrato ? escola.quantidadeConvitesContrato.toString() : "",
      quantidadeSenhasExtras: escola.quantidadeSenhasExtras ? escola.quantidadeSenhasExtras.toString() : "",
      valorSenhaExtra: escola.valorSenhaExtra ? escola.valorSenhaExtra.toString() : "",
      valorBaile: escola.valorBaile ? escola.valorBaile.toString() : "",
      valorKitFormatura: escola.valorKitFormatura ? escola.valorKitFormatura.toString() : "",
      valorPlacaReplica: escola.valorPlacaReplica ? escola.valorPlacaReplica.toString() : "",
      valorPlacaHomenagem: escola.valorPlacaHomenagem ? escola.valorPlacaHomenagem.toString() : ""
    });
    setView("escola");
  }

  async function salvarComissao() {
    if (!infraOnline) {
      alert("Nao foi possivel salvar. Servidor ou banco de dados offline.");
      return;
    }

    if (!comissaoForm.escolaId || !comissaoForm.alunoId) {
      alert("Selecione a escola e o aluno da comissao.");
      return;
    }

    const response = await apiFetch(`${apiUrl}/comissao-formatura`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        escolaId: parseInt(comissaoForm.escolaId),
        alunoId: parseInt(comissaoForm.alunoId),
        desconto: parseMoney(comissaoForm.desconto)
      })
    });
    if (!response.ok) {
      alert("Nao foi possivel cadastrar o aluno na comissao.");
      return;
    }

    alert("Aluno adicionado na comissao!");
    setComissaoForm({ escolaId: comissaoForm.escolaId, alunoId: "", desconto: "" });
    carregarComissao(comissaoForm.escolaId);
  }

  async function excluirAluno(alunoId: number) {
    if (!window.confirm("Deseja realmente excluir este cadastro?")) return;

    const response = await apiFetch(`${apiUrl}/alunos/${alunoId}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Nao foi possivel excluir este cadastro.");
      return;
    }

    if (alunoSelecionado?.id === alunoId) {
      setAlunoSelecionado(null);
      setPagamentos([]);
    }
    if (alunoDetalhe?.id === alunoId) {
      setAlunoDetalhe(null);
      setComissaoAlunoDetalhe(null);
    }
    if (alunoFinanceiro?.id === alunoId) {
      setAlunoFinanceiro(null);
      setPagamentosFinanceiro([]);
    }
    setAlunos((lista) => lista.filter((aluno) => aluno.id !== alunoId));
    listarTodos();
  }

  async function excluirEscola(escolaId: number) {
    if (!window.confirm("Deseja realmente excluir esta escola?")) return;

    const response = await apiFetch(`${apiUrl}/escolas/${escolaId}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Nao foi possivel excluir esta escola.");
      return;
    }

    if (escolaDetalhe?.id === escolaId) {
      setEscolaDetalhe(null);
      setMostrarAlunosEscola(false);
    }
    listarEscolas();
  }

  function selecionarAlunoParaPagamento(aluno: Aluno) {
    setAlunoSelecionado(aluno);
    setPagamento({ alunoId: aluno.id.toString(), valor: "" });
    setNumeroParcela("");
    setUltimoPagamento(null);
    carregarPagamentos(aluno.id);
  }

  function abrirPagamentoAluno(aluno: Aluno) {
    selecionarAlunoParaPagamento(aluno);
    setView("aluno");
  }

  async function carregarPagamentos(alunoId: number) {
    const response = await apiFetch(`${apiUrl}/pagamentos/aluno/${alunoId}`);
    setPagamentos(await response.json());
  }

  async function abrirUltimoReciboAluno(aluno: Aluno) {
    const response = await apiFetch(`${apiUrl}/pagamentos/aluno/${aluno.id}`);
    if (!response.ok) {
      alert("Nao foi possivel carregar os pagamentos deste aluno.");
      return;
    }

    const pagamentosAluno: Pagamento[] = await response.json();
    if (!pagamentosAluno.length) {
      alert("Este aluno ainda nao possui pagamento para gerar recibo.");
      return;
    }

    const ultimo = [...pagamentosAluno].sort((a: Pagamento, b: Pagamento) => Number(b.id || 0) - Number(a.id || 0))[0];
    abrirRecibo(ultimo, ultimo.aluno || aluno);
  }

  async function registrarPagamento() {
    if (!infraOnline) {
      alert("Nao foi possivel salvar. Servidor ou banco de dados offline.");
      return;
    }

    if (!pagamento.valor || !pagamento.alunoId) {
      alert("Preencha o valor do pagamento.");
      return;
    }

    const data = {
      aluno: { id: parseInt(pagamento.alunoId) },
      valor: parseMoney(pagamento.valor),
      numeroParcela: numeroParcela ? parseInt(numeroParcela) : 0,
      descricao: ""
    };
    const response = await apiFetch(`${apiUrl}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      alert("Nao foi possivel registrar o pagamento.");
      return;
    }

    const pagamentoSalvo = await response.json();
    setUltimoPagamento(pagamentoSalvo);
    alert("Pagamento registrado!");
    setPagamento({ alunoId: pagamento.alunoId, valor: "" });
    setNumeroParcela("");

    if (alunoSelecionado) {
      carregarPagamentos(alunoSelecionado.id);
      const alunoResponse = await apiFetch(`${apiUrl}/alunos?nome=${encodeURIComponent(alunoSelecionado.nome)}`);
      const updatedAlunos = await alunoResponse.json();
      const atualizado = updatedAlunos.find((aluno: Aluno) => aluno.id === alunoSelecionado.id) || updatedAlunos[0];
      if (atualizado) setAlunoSelecionado(atualizado);
      listarTodos();
    }
  }

  function abrirRecibo(pagamentoRecibo: Pagamento | null, alunoRecibo: Aluno | null) {
    if (!alunoRecibo || !pagamentoRecibo?.valor) {
      alert("Registre ou selecione um pagamento para gerar o recibo.");
      return;
    }

    const dataPagamento = pagamentoRecibo.dataPagamento ? new Date(pagamentoRecibo.dataPagamento) : new Date();
    const parcelaTexto = pagamentoRecibo.numeroParcela ? `Parcela ${pagamentoRecibo.numeroParcela}` : "Parcela nao informada";
    const whatsappRecibo = linkWhatsApp(
      alunoRecibo.telefone,
      `Olá, ${alunoRecibo.nomeResponsavel || ""}. Segue o recibo de pagamento do(a) aluno(a) ${alunoRecibo.nome}, no valor de ${moeda(pagamentoRecibo.valor)}, referente a ${parcelaTexto}.`
    );
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de pagamento</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
    .card { max-width: 720px; margin: auto; border: 1px solid #cbd5e1; border-radius: 24px; padding: 32px; background: #fff; }
    .title { font-size: 1.7rem; font-weight: 700; margin-bottom: 16px; }
    .label { font-size: 0.9rem; color: #475569; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 20px; }
    .value { font-size: 1.15rem; color: #0f172a; margin-top: 8px; }
    .actions { margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap; }
    .whatsapp { display: inline-block; border-radius: 999px; padding: 12px 18px; background: #16a34a; color: #fff; font-weight: 700; text-decoration: none; }
    .footer { margin-top: 32px; font-size: 0.95rem; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Recibo de Pagamento</div>
    <div><span class="label">Nome do aluno</span><div class="value">${alunoRecibo.nome}</div></div>
    <div><span class="label">Nome do responsavel</span><div class="value">${alunoRecibo.nomeResponsavel || "-"}</div></div>
    <div><span class="label">Escola</span><div class="value">${alunoRecibo.escola || "-"}</div></div>
    <div><span class="label">Data</span><div class="value">${dataPagamento.toLocaleDateString("pt-BR")}</div></div>
    <div><span class="label">Valor pago</span><div class="value">${moeda(pagamentoRecibo.valor)}</div></div>
    <div><span class="label">Numero da parcela</span><div class="value">${parcelaTexto}</div></div>
    <div class="actions"><a class="whatsapp" href="${whatsappRecibo}" target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a></div>
    <div class="footer">Este recibo confirma o pagamento realizado pelo aluno acima.</div>
  </div>
</body>
</html>`;
    const receiptWindow = window.open("", "_blank", "width=820,height=960");
    if (receiptWindow) {
      receiptWindow.document.write(html);
      receiptWindow.document.close();
    }
  }

  function abrirResumoFinanceiro(alunoResumo: Aluno) {
    const escolaResumo = buscarEscolaDoAluno(alunoResumo);
    const servicos = servicosDoAluno(alunoResumo);
    const formaPagamentoTexto = alunoResumo.formaPagamento || "Nao informada";
    const parcelasTexto = alunoResumo.parcelas ? alunoResumo.parcelas.toString() : "0";
    const valorMensalTexto = moeda(alunoResumo.valorMensal);
    const itensContratoTexto = servicos.length
      ? servicos
          .map((servico) => `${servico.nome} x${servico.quantidade}: ${moeda(servico.valorUnitario * servico.quantidade)}`)
          .join("; ")
      : "Nenhum item marcado";
    const textoResumoFinanceiro = `Itens fechados no contrato: ${itensContratoTexto}. Forma de pagamento: ${formaPagamentoTexto}. Valor da parcela mensal: ${valorMensalTexto}. Numero de parcelas: ${parcelasTexto}. Valor total do contrato: ${moeda(alunoResumo.valorContrato)}. Valor restante: ${moeda(alunoResumo.valorRestanteContrato ?? alunoResumo.valorContrato)}.`;
    const whatsappResumo = linkWhatsApp(
      alunoResumo.telefone,
      `Ola, ${alunoResumo.nomeResponsavel || ""}. Segue o resumo financeiro do contrato do(a) aluno(a) ${alunoResumo.nome}. ${textoResumoFinanceiro}`
    );
    const linhasServicos = servicos.length
      ? servicos.map((servico) => `
        <tr>
          <td>${servico.nome}</td>
          <td>${servico.quantidade}</td>
          <td>${moeda(servico.valorUnitario)}</td>
          <td>${moeda(servico.valorUnitario * servico.quantidade)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="4">Nenhum servico marcado.</td></tr>`;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Resumo financeiro</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; background: #f8fafc; }
    .card { max-width: 860px; margin: auto; border: 1px solid #cbd5e1; border-radius: 24px; padding: 32px; background: #fff; }
    .title { font-size: 1.7rem; font-weight: 700; margin-bottom: 22px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .label { font-size: 0.78rem; color: #475569; text-transform: uppercase; letter-spacing: 0.12em; }
    .value { font-size: 1.05rem; color: #0f172a; margin-top: 6px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; }
    th { background: #f1f5f9; color: #475569; font-size: 0.85rem; }
    .total { margin-top: 24px; padding: 18px; border-radius: 18px; background: #e0f2fe; font-size: 1.3rem; font-weight: 700; }
    .actions { margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap; }
    .whatsapp { display: inline-block; border-radius: 999px; padding: 12px 18px; background: #16a34a; color: #fff; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Resumo Financeiro do Aluno</div>
    <div class="grid">
      <div><div class="label">Nome do aluno</div><div class="value">${alunoResumo.nome}</div></div>
      <div><div class="label">Responsavel</div><div class="value">${alunoResumo.nomeResponsavel || "-"}</div></div>
      <div><div class="label">Escola</div><div class="value">${alunoResumo.escola || "-"}</div></div>
      <div><div class="label">Turma</div><div class="value">${alunoResumo.turma || "-"}</div></div>
      <div><div class="label">Data do baile</div><div class="value">${formatarData(escolaResumo?.dataBaileFormatura)}</div></div>
      <div><div class="label">Inicio do pagamento</div><div class="value">${formatarMes(escolaResumo?.mesInicioPagamento)}</div></div>
      <div><div class="label">Forma de pagamento</div><div class="value">${formaPagamentoTexto}</div></div>
      <div><div class="label">Valor da parcela mensal</div><div class="value">${valorMensalTexto}</div></div>
      <div><div class="label">Numero de parcelas</div><div class="value">${parcelasTexto}</div></div>
      <div><div class="label">Senhas do contrato</div><div class="value">${escolaResumo?.quantidadeConvitesContrato ?? 0}</div></div>
    </div>
    <div class="label">Texto do resumo financeiro</div>
    <div class="value">${textoResumoFinanceiro}</div>
    <div class="label">Servicos marcados em contrato</div>
    <table>
      <thead>
        <tr>
          <th>Servico</th>
          <th>Quantidade</th>
          <th>Valor unitario</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${linhasServicos}</tbody>
    </table>
    <div class="total">Valor total do contrato: ${moeda(alunoResumo.valorContrato)}</div>
    <div class="actions"><a class="whatsapp" href="${whatsappResumo}" target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a></div>
  </div>
</body>
</html>`;
    const resumoWindow = window.open("", "_blank", "width=920,height=980");
    if (resumoWindow) {
      resumoWindow.document.write(html);
      resumoWindow.document.close();
    }
  }

  function abrirResumoComissaoFormatura() {
    if (!escolaComissao) {
      alert("Selecione uma escola para gerar o resumo da comissao.");
      return;
    }
    if (comissaoFormatura.length === 0) {
      alert("Esta escola ainda nao possui alunos na comissao.");
      return;
    }

    const totalOriginal = comissaoFormatura.reduce((acc, membro) => acc + Number(membro.valorContratoOriginal || 0), 0);
    const totalDesconto = comissaoFormatura.reduce((acc, membro) => acc + Number(membro.desconto || 0), 0);
    const totalComDesconto = comissaoFormatura.reduce((acc, membro) => acc + Number(membro.valorContratoComDesconto || 0), 0);
    const linhasMembros = comissaoFormatura.map((membro) => `
      <tr>
        <td>${membro.nomeAluno || "-"}</td>
        <td>${membro.nomeResponsavel || "-"}</td>
        <td>${membro.turma || "-"}</td>
        <td>${moeda(membro.valorContratoOriginal)}</td>
        <td>${moeda(membro.desconto)}</td>
        <td>${moeda(membro.valorContratoComDesconto)}</td>
      </tr>
    `).join("");
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Resumo financeiro da comissao</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; background: #f8fafc; }
    .card { max-width: 980px; margin: auto; border: 1px solid #cbd5e1; border-radius: 24px; padding: 32px; background: #fff; }
    .title { font-size: 1.7rem; font-weight: 700; margin-bottom: 22px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .box { border-radius: 18px; background: #f1f5f9; padding: 16px; }
    .label { font-size: 0.78rem; color: #475569; text-transform: uppercase; letter-spacing: 0.12em; }
    .value { font-size: 1.05rem; color: #0f172a; margin-top: 6px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; }
    th { background: #f1f5f9; color: #475569; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Resumo Financeiro da Comissao de Formatura</div>
    <div class="grid">
      <div class="box"><div class="label">Escola</div><div class="value">${escolaComissao.nomeEscola}</div></div>
      <div class="box"><div class="label">Alunos na comissao</div><div class="value">${comissaoFormatura.length}</div></div>
      <div class="box"><div class="label">Data do baile</div><div class="value">${formatarData(escolaComissao.dataBaileFormatura)}</div></div>
      <div class="box"><div class="label">Total original</div><div class="value">${moeda(totalOriginal)}</div></div>
      <div class="box"><div class="label">Total de descontos</div><div class="value">${moeda(totalDesconto)}</div></div>
      <div class="box"><div class="label">Total com desconto</div><div class="value">${moeda(totalComDesconto)}</div></div>
    </div>
    <div class="label">Alunos da comissao</div>
    <table>
      <thead>
        <tr>
          <th>Aluno</th>
          <th>Responsavel</th>
          <th>Turma</th>
          <th>Contrato original</th>
          <th>Desconto</th>
          <th>Com desconto</th>
        </tr>
      </thead>
      <tbody>${linhasMembros}</tbody>
    </table>
  </div>
</body>
</html>`;
    const resumoWindow = window.open("", "_blank", "width=1040,height=980");
    if (resumoWindow) {
      resumoWindow.document.write(html);
      resumoWindow.document.close();
    }
  }

  function menuInicial() {
    const inadimplentes = alunos.filter(alunoEstaInadimplente).length;
    const demandas = [
      { titulo: "Aluno pediu segunda via do contrato", aluno: alunos[0]?.nome || "Aluno", departamento: "Contratos", prioridade: "media", status: "aberta" },
      { titulo: "Aluno enviou comprovante", aluno: alunos[1]?.nome || alunos[0]?.nome || "Aluno", departamento: "Financeiro", prioridade: "alta", status: "em andamento" },
      { titulo: "Aluno pediu cancelamento", aluno: alunos[2]?.nome || alunos[0]?.nome || "Aluno", departamento: "Distratos", prioridade: "urgente", status: "aberta" }
    ];
    const prioridadeClasse: Record<string, string> = {
      media: "bg-sky-100 text-sky-800",
      alta: "bg-amber-100 text-amber-800",
      urgente: "bg-rose-100 text-rose-800"
    };

    return (
      <section className="space-y-7">
        <div className="grid gap-5 xl:grid-cols-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Em aberto</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{financeiroResumo.emAberto}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Pagos</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{financeiroResumo.pagos}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Inadimplentes</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{inadimplentes}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Turmas/Eventos</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{indicadores.totalEscolas}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Demandas recentes</h2>
            <div className="mt-6 space-y-4">
              {demandas.map((demanda) => (
                <div key={demanda.titulo} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-slate-950">{demanda.titulo}</p>
                    <p className="mt-2 text-base text-[#08265f]">{demanda.aluno} · {demanda.departamento}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-xl px-4 py-3 text-sm font-semibold ${prioridadeClasse[demanda.prioridade]}`}>{demanda.prioridade}</span>
                    <select value={demanda.status} onChange={() => undefined} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-lg text-slate-950">
                      <option value="aberta">aberta</option>
                      <option value="em andamento">em andamento</option>
                      <option value="aguardando">aguardando</option>
                      <option value="concluida">concluida</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Mapa de departamentos</h2>
            <div className="mt-6 space-y-4">
              {[
                ["Financeiro", "1 abertas"],
                ["Atendimento", "0 abertas"],
                ["Contratos", "1 abertas"],
                ["Eventos", "0 abertas"],
                ["Distratos", "1 abertas"],
                ["Administração", "0 abertas"]
              ].map(([departamento, abertas]) => (
                <div key={departamento} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xl font-semibold text-slate-950">{departamento}</p>
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#08265f]">{abertas}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function menuInicialInterativo() {
    const inadimplentes = alunos.filter(alunoEstaInadimplente).length;
    const prioridadeClasse: Record<string, string> = {
      baixa: "bg-slate-100 text-slate-700",
      media: "bg-sky-100 text-sky-800",
      alta: "bg-amber-100 text-amber-800",
      urgente: "bg-rose-100 text-rose-800"
    };
    const departamentosResumo = ["Financeiro", "Atendimento", "Contratos", "Eventos", "Distratos", "Administração"];

    return (
      <section className="space-y-7">
        <div className="grid gap-5 xl:grid-cols-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Em aberto</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{financeiroResumo.emAberto}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Pagos</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{financeiroResumo.pagos}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Inadimplentes</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{inadimplentes}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Turmas/Eventos</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{indicadores.totalEscolas}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Demandas recentes</h2>
            <div className="mt-6 space-y-4">
              {demandasComAluno.slice(0, 3).map((demanda) => (
                <div
                  key={demanda.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDemandaSelecionadaId(demanda.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") setDemandaSelecionadaId(demanda.id); }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-white"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-950">{demanda.titulo}</p>
                      <p className="mt-2 text-base text-[#08265f]">{demanda.aluno} - {demanda.departamento}</p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                      <span className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${prioridadeClasse[demanda.prioridade]}`}>{demanda.prioridade}</span>
                      <select value={demanda.status} onClick={(e) => e.stopPropagation()} onChange={(e) => atualizarStatusDemanda(demanda.id, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-950 sm:w-44">
                        <option value="aberta">aberta</option>
                        <option value="em andamento">em andamento</option>
                        <option value="aguardando">aguardando</option>
                        <option value="concluida">concluida</option>
                      </select>
                    </div>
                  </div>

                  {demandaSelecionadaId === demanda.id && (
                    <div className="mt-4 border-t border-slate-200 pt-4" onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm font-semibold text-slate-700">Comentários</p>
                      <div className="mt-2 space-y-2 text-sm text-[#08265f]">
                        {demanda.comentarios.map((comentario, index) => (
                          <p key={`${demanda.id}-${index}`} className="rounded-xl bg-white px-4 py-3">{comentario}</p>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <textarea value={comentarioDemanda} onChange={(e) => setComentarioDemanda(e.target.value)} placeholder="Adicionar comentário" className="min-h-24 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
                        <button type="button" onClick={adicionarComentarioDemanda} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Comentar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Mapa de departamentos</h2>
            <div className="mt-6 space-y-4">
              {departamentosResumo.map((departamento) => (
                <div key={departamento} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xl font-semibold text-slate-950">{departamento}</p>
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#08265f]">
                    {demandasInternas.filter((demanda) => demanda.departamento === departamento && demanda.status !== "concluida").length} abertas
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function painelFinanceiroAluno() {
    if (!alunoFinanceiro) return null;

    return (
      <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Financeiro</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{alunoFinanceiro.nome}</h3>
            <p className="mt-1 text-sm text-slate-600">{alunoFinanceiro.escola || "-"} {alunoFinanceiro.turma ? `- ${alunoFinanceiro.turma}` : ""}</p>
          </div>
          <button type="button" onClick={fecharFinanceiroAluno} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Fechar financeiro</button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor total</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(alunoFinanceiro.valorContrato)}</p>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor pago</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(Number(alunoFinanceiro.valorContrato || 0) - Number(alunoFinanceiro.valorRestanteContrato ?? alunoFinanceiro.valorContrato ?? 0))}</p>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Falta quitar</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(alunoFinanceiro.valorRestanteContrato ?? alunoFinanceiro.valorContrato)}</p>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Forma de pagamento</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{alunoFinanceiro.formaPagamento || "-"}</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Parcela</th>
                <th className="px-5 py-4 font-medium">Data</th>
                <th className="px-5 py-4 font-medium">Valor pago</th>
                <th className="px-5 py-4 font-medium">Recibo</th>
              </tr>
            </thead>
            <tbody>
              {pagamentosFinanceiro.length > 0 ? (
                pagamentosFinanceiro.map((pagamentoItem) => (
                  <tr key={pagamentoItem.id} className="border-t border-slate-200">
                    <td className="px-5 py-4">{pagamentoItem.numeroParcela || "-"}</td>
                    <td className="px-5 py-4">{pagamentoItem.dataPagamento ? new Date(pagamentoItem.dataPagamento).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="px-5 py-4">{moeda(pagamentoItem.valor)}</td>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => abrirRecibo(pagamentoItem, pagamentoItem.aluno || alunoFinanceiro)} className="rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Gerar recibo</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-500">Nenhum pagamento registrado para este aluno.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function buscaAlunosInicio() {
    return (
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-950">Buscar alunos</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <input type="text" placeholder="Nome do aluno" value={search.nome} onChange={(e) => setSearch({ ...search, nome: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="text" placeholder="Nome do responsavel" value={search.responsavel} onChange={(e) => setSearch({ ...search, responsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="text" placeholder="Escola" value={search.escola} onChange={(e) => setSearch({ ...search, escola: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={pesquisar} className="rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Pesquisar</button>
            <button type="button" onClick={listarBusca} className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Listar</button>
            <button type="button" onClick={limparBusca} className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Limpar</button>
          </div>
        </div>

        {resultadoBuscaVisivel && (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">Resultado da pesquisa</h2>
            <p className="mt-1 text-sm text-slate-500">{alunos.length} alunos encontrados.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Nome</th>
                  <th className="px-5 py-4 font-medium">Escola</th>
                  <th className="px-5 py-4 font-medium">Turma</th>
                  <th className="px-5 py-4 font-medium">Contrato</th>
                  <th className="px-5 py-4 font-medium">Restante</th>
                  <th className="px-5 py-4 font-medium">Servicos</th>
                  <th className="px-5 py-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <tr key={aluno.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-5 py-4">{aluno.nome}</td>
                      <td className="px-5 py-4">{aluno.escola || "-"}</td>
                      <td className="px-5 py-4">{aluno.turma || "-"}</td>
                      <td className="px-5 py-4">{moeda(aluno.valorContrato)}</td>
                      <td className="px-5 py-4">{moeda(aluno.valorRestanteContrato ?? aluno.valorContrato)}</td>
                      <td className="px-5 py-4">
                        {[
                          aluno.baile ? "Baile" : "",
                          aluno.kitFormatura ? "Kit" : "",
                          aluno.placaHomenagem ? `Homenagem x${aluno.quantidadePlacaHomenagem || 1}` : "",
                          aluno.placaReplica ? `Replica x${aluno.quantidadePlacaReplica || 1}` : ""
                        ].filter(Boolean).join(", ") || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button type="button" onClick={() => { abrirAlunoDetalhe(aluno); setView("alunos"); }} className="rounded-3xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">Ver aluno</button>
                          <button type="button" onClick={() => abrirEscolaDoAluno(aluno)} className="rounded-3xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">Ver escola</button>
                          <button type="button" onClick={() => selecionarAlunoParaPagamento(aluno)} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Pagamento</button>
                          <button type="button" onClick={() => abrirFinanceiroAluno(aluno)} className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Resumo financeiro</button>
                          <button type="button" onClick={() => excluirAluno(aluno.id)} className="rounded-3xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-slate-500">Nenhum aluno encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </section>
    );
  }

  function consultaAlunos() {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Alunos cadastrados</h2>
            <p className="mt-2 text-slate-600">Selecione um aluno para abrir todos os dados do cadastro.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => { setAlunoSelecionado(null); setView("aluno"); listarEscolas(); }} className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Cadastrar aluno</button>
            <button type="button" onClick={() => { setView("menu"); setAlunoDetalhe(null); setComissaoAlunoDetalhe(null); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
          </div>
        </div>

        {alunoDetalhe ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Detalhes do aluno</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-950">{alunoDetalhe.nome}</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => editarAluno(alunoDetalhe)} className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Editar cadastro</button>
                <button type="button" onClick={() => abrirFinanceiroAluno(alunoDetalhe)} className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Financeiro</button>
                <button type="button" onClick={() => excluirAluno(alunoDetalhe.id)} className="rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">Excluir cadastro</button>
                <button type="button" onClick={() => { setAlunoDetalhe(null); setComissaoAlunoDetalhe(null); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Ver lista</button>
              </div>
            </div>

            {comissaoAlunoDetalhe && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Comissao de formatura</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">Este aluno faz parte da comissao.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contrato original</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{moeda(comissaoAlunoDetalhe.valorContratoOriginal)}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Desconto</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{moeda(comissaoAlunoDetalhe.desconto)}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor com desconto</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{moeda(comissaoAlunoDetalhe.valorContratoComDesconto)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Responsavel</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunoDetalhe.nomeResponsavel || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Telefone do aluno</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunoDetalhe.telefone || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Escola</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunoDetalhe.escola || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Turma</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunoDetalhe.turma || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Parcelas</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunoDetalhe.parcelas || 0}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Forma de pagamento</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunoDetalhe.formaPagamento || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor mensal</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{moeda(alunoDetalhe.valorMensal)}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-sky-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Valor total do contrato</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{moeda(alunoDetalhe.valorContrato)}</p>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Valor restante</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{moeda(alunoDetalhe.valorRestanteContrato ?? alunoDetalhe.valorContrato)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-lg font-semibold text-slate-950">Servicos contratados</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  alunoDetalhe.baile ? "Baile" : "",
                  alunoDetalhe.kitFormatura ? "Kit Formatura" : "",
                  alunoDetalhe.placaReplica ? `Placa replica x${alunoDetalhe.quantidadePlacaReplica || 1}` : "",
                  alunoDetalhe.placaHomenagem ? `Placa de homenagem x${alunoDetalhe.quantidadePlacaHomenagem || 1}` : ""
                ].filter(Boolean).map((servico) => (
                  <div key={servico} className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">{servico}</div>
                ))}
                {!alunoDetalhe.baile && !alunoDetalhe.kitFormatura && !alunoDetalhe.placaReplica && !alunoDetalhe.placaHomenagem && (
                  <div className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-500">Nenhum servico marcado.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  value={search.nome}
                  onChange={(e) => setSearch({ ...search, nome: e.target.value })}
                  placeholder="Nome do aluno"
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                <input
                  value={search.responsavel}
                  onChange={(e) => setSearch({ ...search, responsavel: e.target.value })}
                  placeholder="Nome do responsavel"
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                <select
                  value={search.escola}
                  onChange={(e) => setSearch({ ...search, escola: e.target.value })}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Todas as escolas</option>
                  {escolas.map((escola) => (
                    <option key={escola.id} value={escola.nomeEscola}>{escola.nomeEscola}</option>
                  ))}
                </select>
                <button type="button" onClick={pesquisar} className="rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
                  Buscar
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={listarBusca} className="rounded-3xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Listar todos
                </button>
                <button type="button" onClick={limparBusca} className="rounded-3xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Limpar busca
                </button>
                {resultadoBuscaVisivel && (
                  <div className="ml-auto rounded-3xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700">
                    {alunosFiltradosOrdenados.length} alunos
                  </div>
                )}
              </div>
            </div>

            {resultadoBuscaVisivel ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <select value={alunoEscolaFiltro} onChange={(e) => setAlunoEscolaFiltro(e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                <option value="">Todas as escolas</option>
                {escolas.map((escola) => (
                  <option key={escola.id} value={escola.nomeEscola}>{escola.nomeEscola}</option>
                ))}
                  </select>
                  <div className="rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
                    {alunosFiltradosOrdenados.length} alunos
                  </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-5 py-4 font-medium">Aluno</th>
                        <th className="px-5 py-4 font-medium">Responsavel</th>
                        <th className="px-5 py-4 font-medium">Escola</th>
                        <th className="px-5 py-4 font-medium">Turma</th>
                        <th className="px-5 py-4 font-medium">Contrato</th>
                        <th className="px-5 py-4 font-medium">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosFiltradosOrdenados.length > 0 ? (
                        alunosFiltradosOrdenados.map((aluno) => (
                          <tr key={aluno.id} className="border-t border-slate-200 hover:bg-slate-50">
                            <td className="px-5 py-4">{aluno.nome}</td>
                            <td className="px-5 py-4">{aluno.nomeResponsavel || "-"}</td>
                            <td className="px-5 py-4">{aluno.escola || "-"}</td>
                            <td className="px-5 py-4">{aluno.turma || "-"}</td>
                            <td className="px-5 py-4">{moeda(aluno.valorContrato)}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <button type="button" onClick={() => abrirAlunoDetalhe(aluno)} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Abrir cadastro</button>
                                <button type="button" onClick={() => abrirFinanceiroAluno(aluno)} className="rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Financeiro</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-6 text-center text-slate-500">Nenhum aluno encontrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
                Use a busca por nome do aluno, responsavel ou escola para carregar a lista.
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  function consultaEscolas() {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Escolas cadastradas</h2>
            <p className="mt-2 text-slate-600">Selecione uma escola para abrir todos os dados do cadastro.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => { setView("escola"); listarEscolas(); }} className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Cadastrar escola</button>
            <button type="button" onClick={() => { setView("menu"); setEscolaDetalhe(null); setMostrarAlunosEscola(false); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
          </div>
        </div>

        {escolaDetalhe ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Detalhes da escola</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-950">{escolaDetalhe.nomeEscola}</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => editarEscola(escolaDetalhe)} className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Editar cadastro</button>
                <button type="button" onClick={() => { setEscolaDetalhe(null); setMostrarAlunosEscola(false); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Ver lista</button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Responsavel</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{escolaDetalhe.responsavel || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Telefone</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{escolaDetalhe.telefoneResponsavel || "-"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inicio do pagamento</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatarMes(escolaDetalhe.mesInicioPagamento)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Data do baile</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatarData(escolaDetalhe.dataBaileFormatura)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Alunos cadastrados</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{alunos.filter((aluno) => aluno.escola === escolaDetalhe.nomeEscola).length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Senhas do contrato</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{escolaDetalhe.quantidadeConvitesContrato || 0}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Senhas extras</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{escolaDetalhe.quantidadeSenhasExtras || 0}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor senha extra</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{moeda(escolaDetalhe.valorSenhaExtra)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-lg font-semibold text-slate-950">Servicos e valores</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Baile</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(escolaDetalhe.valorBaile)}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Kit Formatura</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(escolaDetalhe.valorKitFormatura)}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Placa replica</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(escolaDetalhe.valorPlacaReplica)}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Placa homenagem</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(escolaDetalhe.valorPlacaHomenagem)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">Alunos desta escola</h4>
                  <p className="mt-1 text-sm text-slate-600">Lista ligada ao cadastro da escola selecionada.</p>
                </div>
                <button type="button" onClick={() => { setMostrarAlunosEscola(!mostrarAlunosEscola); listarTodos(); }} className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
                  {mostrarAlunosEscola ? "Ocultar alunos" : "Listar alunos"}
                </button>
              </div>

              {mostrarAlunosEscola && (
                <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-5 py-4 font-medium">Aluno</th>
                        <th className="px-5 py-4 font-medium">Responsavel</th>
                        <th className="px-5 py-4 font-medium">Turma</th>
                        <th className="px-5 py-4 font-medium">Contrato</th>
                        <th className="px-5 py-4 font-medium">Restante</th>
                        <th className="px-5 py-4 font-medium">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosDaEscolaDetalhe.length > 0 ? (
                        alunosDaEscolaDetalhe.map((aluno) => (
                          <tr key={aluno.id} className="border-t border-slate-200 hover:bg-slate-50">
                            <td className="px-5 py-4">{aluno.nome}</td>
                            <td className="px-5 py-4">{aluno.nomeResponsavel || "-"}</td>
                            <td className="px-5 py-4">{aluno.turma || "-"}</td>
                            <td className="px-5 py-4">{moeda(aluno.valorContrato)}</td>
                            <td className="px-5 py-4">{moeda(aluno.valorRestanteContrato ?? aluno.valorContrato)}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <button type="button" onClick={() => abrirPagamentoAluno(aluno)} className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Pagamento</button>
                                <button type="button" onClick={() => abrirFinanceiroAluno(aluno)} className="rounded-3xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">Financeiro</button>
                                <button type="button" onClick={() => abrirResumoFinanceiro(aluno)} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Resumo</button>
                                <button type="button" onClick={() => abrirUltimoReciboAluno(aluno)} className="rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Recibo</button>
                                <button type="button" onClick={() => editarAluno(aluno)} className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Editar</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-6 text-center text-slate-500">Nenhum aluno cadastrado nesta escola.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Escola</th>
                  <th className="px-5 py-4 font-medium">Responsavel</th>
                  <th className="px-5 py-4 font-medium">Telefone</th>
                  <th className="px-5 py-4 font-medium">Data baile</th>
                  <th className="px-5 py-4 font-medium">Inicio pag.</th>
                  <th className="px-5 py-4 font-medium">Senhas contrato</th>
                  <th className="px-5 py-4 font-medium">Senhas extras</th>
                  <th className="px-5 py-4 font-medium">Valor extra</th>
                  <th className="px-5 py-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {escolas.length > 0 ? (
                  escolas.map((escola) => (
                    <tr key={escola.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-5 py-4">{escola.nomeEscola}</td>
                      <td className="px-5 py-4">{escola.responsavel || "-"}</td>
                      <td className="px-5 py-4">{escola.telefoneResponsavel || "-"}</td>
                      <td className="px-5 py-4">{formatarData(escola.dataBaileFormatura)}</td>
                      <td className="px-5 py-4">{formatarMes(escola.mesInicioPagamento)}</td>
                      <td className="px-5 py-4">{escola.quantidadeConvitesContrato || 0}</td>
                      <td className="px-5 py-4">{escola.quantidadeSenhasExtras || 0}</td>
                      <td className="px-5 py-4">{moeda(escola.valorSenhaExtra)}</td>
                      <td className="px-5 py-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setEscolaDetalhe(escola); setMostrarAlunosEscola(false); listarTodos(); }} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Abrir cadastro</button>
                        <button type="button" onClick={() => excluirEscola(escola.id)} className="rounded-3xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">Excluir</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-6 text-center text-slate-500">Nenhuma escola cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  function contaPagamentoAluno() {
    if (!alunoSelecionado) return null;

    return (
      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Conta de pagamento</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{alunoSelecionado.nome}</h2>
              <p className="mt-1 text-sm text-slate-600">{alunoSelecionado.nomeResponsavel || "-"} · {alunoSelecionado.escola || "-"}</p>
            </div>
            <button type="button" onClick={() => setAlunoSelecionado(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Fechar</button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Valor total do contrato</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorTotalContrato)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Valor para quitar</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorRestanteContrato)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="number" step="0.01" placeholder="Valor do pagamento (R$)" value={pagamento.valor} onChange={(e) => setPagamento({ ...pagamento, valor: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="number" min="1" placeholder="N. da parcela" value={numeroParcela} onChange={(e) => setNumeroParcela(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={registrarPagamento} disabled={!infraOnline} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Confirmar pagamento</button>
            <button type="button" onClick={() => abrirResumoFinanceiro(alunoSelecionado)} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Gerar resumo financeiro</button>
            <button type="button" onClick={() => abrirRecibo(ultimoPagamento, alunoSelecionado)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Gerar recibo</button>
          </div>

          {pagamentos.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-950">Historico de pagamentos</h3>
              <div className="mt-4 space-y-3">
                {pagamentos.map((pag) => (
                  <div key={pag.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Parcela {pag.numeroParcela || 0}</p>
                        <p className="text-lg font-semibold text-slate-950">{moeda(pag.valor)}</p>
                      </div>
                      <button type="button" onClick={() => abrirRecibo(pag, pag.aluno || alunoSelecionado)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Recibo</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  function financeiroView() {
    return (
      <section className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Em aberto</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{financeiroResumo.emAberto}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Pagos</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{financeiroResumo.pagos}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Inadimplentes</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">{alunos.filter(alunoEstaInadimplente).length}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="grid flex-1 gap-3 md:grid-cols-3">
              <input type="text" placeholder="Nome do aluno" value={financeiroBusca.nome} onChange={(e) => setFinanceiroBusca({ ...financeiroBusca, nome: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="text" placeholder="Nome do responsavel" value={financeiroBusca.responsavel} onChange={(e) => setFinanceiroBusca({ ...financeiroBusca, responsavel: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="text" placeholder="Escola" value={financeiroBusca.escola} onChange={(e) => setFinanceiroBusca({ ...financeiroBusca, escola: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            </div>
            <button type="button" onClick={buscarAlunoFinanceiro} className="rounded-2xl bg-sky-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-700">Buscar aluno</button>
          </div>

          {financeiroBuscaRealizada && (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Aluno</th>
                    <th className="px-5 py-4 font-semibold">Responsavel</th>
                    <th className="px-5 py-4 font-semibold">Escola</th>
                    <th className="px-5 py-4 font-semibold">Turma</th>
                    <th className="px-5 py-4 font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {financeiroResultados.length > 0 ? (
                    financeiroResultados.map((aluno) => (
                      <tr key={aluno.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-950">{aluno.nome}</td>
                        <td className="px-5 py-4">{aluno.nomeResponsavel || "-"}</td>
                        <td className="px-5 py-4">{aluno.escola || "-"}</td>
                        <td className="px-5 py-4">{aluno.turma || "-"}</td>
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => abrirFinanceiroAluno(aluno)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Selecionar</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-500">Nenhum aluno encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={alunoSelecionado || alunoFinanceiro ? "grid gap-4 xl:grid-cols-[1fr_0.9fr]" : "grid gap-4"}>
          {contaPagamentoAluno()}
          {painelFinanceiroAluno()}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Parcelas e comprovantes</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {["todos", "pendente", "pago", "atrasado", "parcial", "cancelado"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFiltroParcela(status)}
                className={`rounded-xl border px-5 py-3 text-lg transition ${filtroParcela === status ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-[#08265f] hover:bg-slate-50"}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-5 py-4 font-semibold">Aluno</th>
                  <th className="px-5 py-4 font-semibold">Turma</th>
                  <th className="px-5 py-4 font-semibold">Parcela</th>
                  <th className="px-5 py-4 font-semibold">Vencimento</th>
                  <th className="px-5 py-4 font-semibold">Valor</th>
                  <th className="px-5 py-4 font-semibold">Comprovante</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {parcelasFinanceiro.length > 0 ? (
                  parcelasFinanceiro.map((item) => (
                    <tr key={item.aluno.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-5 py-5 font-semibold text-slate-950">{item.aluno.nome}</td>
                      <td className="px-5 py-5">{item.aluno.turma || "-"}</td>
                      <td className="px-5 py-5">{item.numero}</td>
                      <td className="px-5 py-5">{item.vencimento}</td>
                      <td className="px-5 py-5">{moeda(item.valor)}</td>
                      <td className="px-5 py-5">{item.comprovante}</td>
                      <td className="px-5 py-5">
                        <select value={item.status} onChange={() => undefined} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                          <option value="pendente">pendente</option>
                          <option value="pago">pago</option>
                          <option value="atrasado">atrasado</option>
                          <option value="parcial">parcial</option>
                          <option value="cancelado">cancelado</option>
                        </select>
                      </td>
                      <td className="px-5 py-5">
                        <button type="button" onClick={() => abrirFinanceiroAluno(item.aluno)} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Pagamento</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-500">Nenhuma parcela encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    );
  }

  function tarefasView() {
    const demandas = demandasInternas.filter((demanda) => demanda.status !== "concluida");
    const prioridadeClasse: Record<string, string> = {
      media: "bg-sky-100 text-sky-800",
      alta: "bg-amber-100 text-amber-800",
      urgente: "bg-rose-100 text-rose-800"
    };

    return (
      <section className="grid gap-6 xl:grid-cols-[475px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Criar demanda</h2>
          <div className="mt-6 space-y-4">
            <input type="text" placeholder="Descrição da demanda" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option>Aluno vinculado</option>
              {alunos.map((aluno) => (
                <option key={aluno.id}>{aluno.nome}</option>
              ))}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option>Financeiro</option>
              <option>Atendimento</option>
              <option>Contratos</option>
              <option>Eventos</option>
              <option>Distratos</option>
              <option>Administração</option>
            </select>
            <input type="text" placeholder="Responsável" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option>media</option>
              <option>baixa</option>
              <option>alta</option>
              <option>urgente</option>
            </select>
            <textarea placeholder="Comentário inicial" className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <button type="button" className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-lg font-semibold text-white transition hover:bg-slate-800">Salvar demanda</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Fila por departamento</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {["todos", "Financeiro", "Atendimento", "Contratos", "Eventos", "Distratos", "Administração"].map((departamento, index) => (
              <button key={departamento} type="button" className={`rounded-xl border px-5 py-3 text-xl transition ${index === 0 ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-[#08265f] hover:bg-slate-50"}`}>
                {departamento}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {demandas.map((demanda) => (
              <div key={demanda.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">{demanda.titulo}</h3>
                    <p className="mt-2 text-lg text-[#08265f]">{demanda.aluno} · {demanda.departamento}</p>
                    <div className="mt-5 space-y-2 text-lg text-[#08265f]">
                      <p>Responsável: {demanda.responsavel}</p>
                      <p>Prazo: {demanda.prazo}</p>
                      <p>Comentários: {demanda.comentarios.length ? demanda.comentarios.join(" | ") : "-"}</p>
                      <p>Anexos: {demanda.anexos.length ? demanda.anexos.join(" | ") : "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-xl px-4 py-3 text-sm font-semibold ${prioridadeClasse[demanda.prioridade]}`}>{demanda.prioridade}</span>
                    <select value={demanda.status} onChange={() => undefined} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xl text-slate-950">
                      <option value="aberta">aberta</option>
                      <option value="em andamento">em andamento</option>
                      <option value="aguardando">aguardando</option>
                      <option value="concluida">concluida</option>
                    </select>
                    <button type="button" onClick={() => removerDemanda(demanda.id)} className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                      Apagar tarefa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function usuariosView() {
    return (
      <section className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Novo usuário</h2>
          <div className="mt-4 space-y-3">
            <input type="text" placeholder="Nome" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="email" placeholder="E-mail" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option>Administrador</option>
              <option>Financeiro</option>
              <option>Atendimento</option>
              <option>Consulta</option>
            </select>
            <button type="button" className="w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Salvar usuário</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Usuários e permissões</h2>
          <p className="mt-2 text-sm text-slate-600">Area visual restaurada para manter o menu completo. Ainda sem persistencia conectada na API antiga.</p>
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Nenhum usuário configurado neste módulo.
          </div>
        </div>
      </section>
    );
  }

  function cadastroEscola() {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">{escolaEditando ? "Editar escola" : "Cadastro de escola"}</h2>
            <p className="mt-2 text-slate-600">{escolaEditando ? "Atualize os dados, senhas e valores dos servicos." : "Registre a escola e os valores dos servicos."}</p>
          </div>
          <button type="button" onClick={() => { resetEscolaForm(); setView("menu"); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input type="text" placeholder="Nome da escola" value={escolaForm.nomeEscola} onChange={(e) => setEscolaForm({ ...escolaForm, nomeEscola: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
          <input type="text" placeholder="Responsavel" value={escolaForm.responsavel} onChange={(e) => setEscolaForm({ ...escolaForm, responsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
          <input type="tel" placeholder="Telefone do responsavel" value={escolaForm.telefoneResponsavel} onChange={(e) => setEscolaForm({ ...escolaForm, telefoneResponsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
          <label className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Data do baile de formatura
            <input type="date" value={escolaForm.dataBaileFormatura} onChange={(e) => setEscolaForm({ ...escolaForm, dataBaileFormatura: e.target.value })} className="mt-1 w-full bg-transparent text-slate-900 outline-none" />
          </label>
          <label className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Mes de inicio de pagamento
            <input type="month" value={escolaForm.mesInicioPagamento} onChange={(e) => setEscolaForm({ ...escolaForm, mesInicioPagamento: e.target.value })} className="mt-1 w-full bg-transparent text-slate-900 outline-none" />
          </label>
          <label className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Data limite para quitar contrato
            <input type="date" value={escolaForm.dataLimiteContrato} onChange={(e) => setEscolaForm({ ...escolaForm, dataLimiteContrato: e.target.value })} className="mt-1 w-full bg-transparent text-slate-900 outline-none" />
          </label>
          <input type="number" min="0" placeholder="Quantidade de senhas do contrato" value={escolaForm.quantidadeConvitesContrato} onChange={(e) => setEscolaForm({ ...escolaForm, quantidadeConvitesContrato: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
          <input type="number" min="0" placeholder="Quantidade de senhas extras" value={escolaForm.quantidadeSenhasExtras} onChange={(e) => setEscolaForm({ ...escolaForm, quantidadeSenhasExtras: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
          <input type="number" step="0.01" min="0" placeholder="Valor da senha extra em R$" value={escolaForm.valorSenhaExtra} onChange={(e) => setEscolaForm({ ...escolaForm, valorSenhaExtra: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-950">Servicos</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="number" step="0.01" placeholder="Baile - valor em R$" value={escolaForm.valorBaile} onChange={(e) => setEscolaForm({ ...escolaForm, valorBaile: e.target.value })} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            <input type="number" step="0.01" placeholder="Kit Formatura - valor em R$" value={escolaForm.valorKitFormatura} onChange={(e) => setEscolaForm({ ...escolaForm, valorKitFormatura: e.target.value })} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            <input type="number" step="0.01" placeholder="Placa replica - valor em R$" value={escolaForm.valorPlacaReplica} onChange={(e) => setEscolaForm({ ...escolaForm, valorPlacaReplica: e.target.value })} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            <input type="number" step="0.01" placeholder="Placa de homenagem - valor em R$" value={escolaForm.valorPlacaHomenagem} onChange={(e) => setEscolaForm({ ...escolaForm, valorPlacaHomenagem: e.target.value })} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={salvarEscola} disabled={!infraOnline} className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">{escolaEditando ? "Atualizar escola" : "Salvar escola"}</button>
          {escolaEditando && (
            <button type="button" onClick={resetEscolaForm} className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar edicao</button>
          )}
          <button type="button" onClick={listarEscolas} className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Listar escolas</button>
          <button type="button" onClick={abrirComissao} className="rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Comissao de formatura</button>
        </div>

        {mostrarComissao && (
          <div className="mt-8 rounded-3xl border border-sky-200 bg-sky-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Comissao de formatura</h3>
                <p className="mt-1 text-sm text-slate-600">Selecione uma escola, puxe um aluno cadastrado e aplique o desconto da comissao.</p>
              </div>
              <button type="button" onClick={() => setMostrarComissao(false)} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Fechar</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <select value={comissaoForm.escolaId} onChange={(e) => { const escolaId = e.target.value; setComissaoForm({ escolaId, alunoId: "", desconto: "" }); carregarComissao(escolaId); }} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                <option value="">Selecione a escola</option>
                {escolas.map((escola) => (
                  <option key={escola.id} value={escola.id}>{escola.nomeEscola}</option>
                ))}
              </select>
              <select value={comissaoForm.alunoId} onChange={(e) => setComissaoForm({ ...comissaoForm, alunoId: e.target.value })} disabled={!escolaComissao} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100">
                <option value="">Selecione o aluno</option>
                {alunosDaEscolaComissao.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                ))}
              </select>
              <input type="number" step="0.01" placeholder="Desconto em R$" value={comissaoForm.desconto} onChange={(e) => setComissaoForm({ ...comissaoForm, desconto: e.target.value })} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <button type="button" onClick={salvarComissao} disabled={!comissaoForm.escolaId || !comissaoForm.alunoId || !infraOnline} className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Adicionar aluno</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={abrirResumoComissaoFormatura} disabled={!escolaComissao || comissaoFormatura.length === 0} className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">Gerar resumo financeiro comissao</button>
              {escolaComissao && (
                <button type="button" onClick={() => carregarComissao(comissaoForm.escolaId)} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Atualizar comissao</button>
              )}
            </div>

            {alunoComissao && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contrato original</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(alunoComissao.valorContrato)}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Desconto</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(comissaoForm.desconto)}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Valor com desconto</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(valorComDescontoPreview)}</p>
                </div>
              </div>
            )}

            {escolaComissao && alunosDaEscolaComissao.length === 0 && (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                Nenhum aluno cadastrado para esta escola ainda.
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-medium">Aluno</th>
                    <th className="px-5 py-4 font-medium">Responsavel</th>
                    <th className="px-5 py-4 font-medium">Turma</th>
                    <th className="px-5 py-4 font-medium">Contrato original</th>
                    <th className="px-5 py-4 font-medium">Desconto</th>
                    <th className="px-5 py-4 font-medium">Com desconto</th>
                  </tr>
                </thead>
                <tbody>
                  {comissaoFormatura.length > 0 ? (
                    comissaoFormatura.map((membro) => (
                      <tr key={membro.id} className="border-t border-slate-200">
                        <td className="px-5 py-4">{membro.nomeAluno}</td>
                        <td className="px-5 py-4">{membro.nomeResponsavel || "-"}</td>
                        <td className="px-5 py-4">{membro.turma || "-"}</td>
                        <td className="px-5 py-4">{moeda(membro.valorContratoOriginal)}</td>
                        <td className="px-5 py-4">{moeda(membro.desconto)}</td>
                        <td className="px-5 py-4">{moeda(membro.valorContratoComDesconto)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-slate-500">Selecione uma escola para consultar a comissao.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {escolas.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Escola</th>
                  <th className="px-5 py-4 font-medium">Responsavel</th>
                  <th className="px-5 py-4 font-medium">Telefone</th>
                  <th className="px-5 py-4 font-medium">Data baile</th>
                  <th className="px-5 py-4 font-medium">Inicio pag.</th>
                  <th className="px-5 py-4 font-medium">Senhas contrato</th>
                  <th className="px-5 py-4 font-medium">Senhas extras</th>
                  <th className="px-5 py-4 font-medium">Valor extra</th>
                  <th className="px-5 py-4 font-medium">Baile</th>
                  <th className="px-5 py-4 font-medium">Kit</th>
                  <th className="px-5 py-4 font-medium">Replica</th>
                  <th className="px-5 py-4 font-medium">Homenagem</th>
                  <th className="px-5 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {escolas.map((escola) => (
                  <tr key={escola.id} className="border-t border-slate-200">
                    <td className="px-5 py-4">{escola.nomeEscola}</td>
                    <td className="px-5 py-4">{escola.responsavel}</td>
                    <td className="px-5 py-4">{escola.telefoneResponsavel}</td>
                    <td className="px-5 py-4">{formatarData(escola.dataLimiteContrato)}</td>
                    <td className="px-5 py-4">{formatarData(escola.dataBaileFormatura)}</td>
                    <td className="px-5 py-4">{formatarMes(escola.mesInicioPagamento)}</td>
                    <td className="px-5 py-4">{escola.quantidadeConvitesContrato || 0}</td>
                    <td className="px-5 py-4">{escola.quantidadeSenhasExtras || 0}</td>
                    <td className="px-5 py-4">{moeda(escola.valorSenhaExtra)}</td>
                    <td className="px-5 py-4">{moeda(escola.valorBaile)}</td>
                    <td className="px-5 py-4">{moeda(escola.valorKitFormatura)}</td>
                    <td className="px-5 py-4">{moeda(escola.valorPlacaReplica)}</td>
                    <td className="px-5 py-4">{moeda(escola.valorPlacaHomenagem)}</td>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => excluirEscola(escola.id)} className="rounded-3xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  function cadastroAluno() {
    return (
      <section className="w-full">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{alunoEditando ? "Editar aluno" : "Cadastrar aluno"}</h2>
              <p className="mt-1 text-xs text-slate-500">Dados completos do contrato.</p>
            </div>
            <button type="button" onClick={() => { resetAlunoForm(); setView("menu"); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
          </div>

          <div className="mt-4 space-y-3">
            <input type="text" placeholder="Nome" value={alunoForm.nome} onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="tel" placeholder="Telefone" value={alunoForm.telefone} onChange={(e) => setAlunoForm({ ...alunoForm, telefone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="text" placeholder="Responsável" value={alunoForm.nomeResponsavel} onChange={(e) => setAlunoForm({ ...alunoForm, nomeResponsavel: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="tel" placeholder="Telefone do responsável" value={alunoForm.telefoneResponsavel} onChange={(e) => setAlunoForm({ ...alunoForm, telefoneResponsavel: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <select value={alunoForm.escolaId} onChange={(e) => setAlunoForm({ ...alunoForm, escolaId: e.target.value, escola: escolas.find((escola) => escola.id.toString() === e.target.value)?.nomeEscola || "" })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option value="">Selecione a escola</option>
              {escolas.map((escola) => (
                <option key={escola.id} value={escola.id}>{escola.nomeEscola}</option>
              ))}
            </select>
            <input type="text" placeholder="Turma" value={alunoForm.turma} onChange={(e) => setAlunoForm({ ...alunoForm, turma: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <select value={alunoForm.formaPagamento} onChange={(e) => setAlunoForm({ ...alunoForm, formaPagamento: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option value="">Forma de pagamento</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartao de credito">Cartao de credito</option>
              <option value="Cartao de debito">Cartao de debito</option>
            </select>
            <input type="number" placeholder="Parcelas" value={alunoForm.parcelas} onChange={(e) => setAlunoForm({ ...alunoForm, parcelas: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Valor do contrato</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(valorContratoAluno)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Valor mensal</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{moeda(valorMensalPreview)}</p>
              </div>
            </div>
          </div>

          {escolas.length === 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
              Cadastre uma escola primeiro para puxar os valores dos servicos.
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Servicos do aluno</h3>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={alunoForm.baile} onChange={(e) => setAlunoForm({ ...alunoForm, baile: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-sky-600" />
                Baile {escolaSelecionada ? `(${moeda(escolaSelecionada.valorBaile)})` : ""}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={alunoForm.kitFormatura} onChange={(e) => setAlunoForm({ ...alunoForm, kitFormatura: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-sky-600" />
                Kit Formatura {escolaSelecionada ? `(${moeda(escolaSelecionada.valorKitFormatura)})` : ""}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={alunoForm.placaHomenagem} onChange={(e) => setAlunoForm({ ...alunoForm, placaHomenagem: e.target.checked, quantidadePlacaHomenagem: e.target.checked ? alunoForm.quantidadePlacaHomenagem : "1" })} className="h-4 w-4 rounded border-slate-300 accent-sky-600" />
                Placa de homenagem {escolaSelecionada ? `(${moeda(escolaSelecionada.valorPlacaHomenagem)} cada)` : ""}
              </label>
              {alunoForm.placaHomenagem && (
                <input type="number" min="1" placeholder="Quantidade de placas homenagem" value={alunoForm.quantidadePlacaHomenagem} onChange={(e) => setAlunoForm({ ...alunoForm, quantidadePlacaHomenagem: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              )}
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={alunoForm.placaReplica} onChange={(e) => setAlunoForm({ ...alunoForm, placaReplica: e.target.checked, quantidadePlacaReplica: e.target.checked ? alunoForm.quantidadePlacaReplica : "1" })} className="h-4 w-4 rounded border-slate-300 accent-sky-600" />
                Placa replica {escolaSelecionada ? `(${moeda(escolaSelecionada.valorPlacaReplica)} cada)` : ""}
              </label>
              {alunoForm.placaReplica && (
                <input type="number" min="1" placeholder="Quantidade de placas replica" value={alunoForm.quantidadePlacaReplica} onChange={(e) => setAlunoForm({ ...alunoForm, quantidadePlacaReplica: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button type="button" onClick={salvarAluno} disabled={!escolaSelecionada || !infraOnline} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300">{alunoEditando ? "Atualizar aluno" : "Salvar aluno"}</button>
            {alunoEditando && (
              <button type="button" onClick={resetAlunoForm} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar edicao</button>
            )}
          </div>
        </div>

        <div className="hidden">
          <h2 className="text-2xl font-semibold text-slate-950">Base de alunos</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <input type="text" placeholder="Buscar por nome, CPF, e-mail ou responsável" value={search.nome} onChange={(e) => setSearch({ ...search, nome: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <select value={alunoEscolaFiltro} onChange={(e) => setAlunoEscolaFiltro(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option value="">Todas as turmas</option>
              {escolas.map((escola) => (
                <option key={escola.id} value={escola.nomeEscola}>{escola.nomeEscola}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-lg">
              <thead className="bg-slate-50 text-[#08265f]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Aluno</th>
                  <th className="px-5 py-4 font-semibold">Turma</th>
                  <th className="px-5 py-4 font-semibold">Responsável</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Histórico</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltradosOrdenados
                  .filter((aluno) => {
                    const termo = search.nome.trim().toLowerCase();
                    if (!termo) return true;
                    return [aluno.nome, aluno.nomeResponsavel, aluno.escola, aluno.turma, aluno.telefone].some((valor) => (valor || "").toLowerCase().includes(termo));
                  })
                  .map((aluno) => (
                    <tr key={aluno.id} onDoubleClick={() => editarAluno(aluno)} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-5 py-5 align-top">
                        <p className="font-semibold text-slate-950">{aluno.nome}</p>
                        <p className="text-sm text-[#37537a]">{aluno.telefone || "-"}</p>
                      </td>
                      <td className="px-5 py-5 align-top">{aluno.turma || "-"}</td>
                      <td className="px-5 py-5 align-top">{aluno.nomeResponsavel || "-"}</td>
                      <td className="px-5 py-5 align-top">
                        <select value={Number(aluno.valorRestanteContrato ?? aluno.valorContrato ?? 0) <= 0 ? "ativo" : "inadimplente"} onChange={() => undefined} className="w-40 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none">
                          <option value="ativo">ativo</option>
                          <option value="pendente">pendente</option>
                          <option value="inadimplente">inadimplente</option>
                          <option value="cancelado">cancelado</option>
                          <option value="concluido">concluido</option>
                        </select>
                      </td>
                      <td className="px-5 py-5 align-top text-[#08265f]">
                        {[aluno.escola ? `Escola ${aluno.escola}` : "", aluno.formaPagamento ? `Pagamento ${aluno.formaPagamento}` : "", aluno.parcelas ? `${aluno.parcelas} parcelas` : ""].filter(Boolean).join(" | ") || "Cadastro importado da API antiga"}
                      </td>
                    </tr>
                  ))}
                {alunosFiltradosOrdenados.filter((aluno) => {
                  const termo = search.nome.trim().toLowerCase();
                  if (!termo) return true;
                  return [aluno.nome, aluno.nomeResponsavel, aluno.escola, aluno.turma, aluno.telefone].some((valor) => (valor || "").toLowerCase().includes(termo));
                }).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">Nenhum aluno encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
        <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-sky-700">TR EVENTOS</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-black">Carregando sistema</h1>
        </div>
      </div>
    );
  }

  if (!authHeader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-950">
        <form onSubmit={entrar} className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-sky-700">TR EVENTOS</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black">Sistema interno</h1>

          <div className="mt-8 space-y-4">
            <input
              value={loginForm.email}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
              className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-5 text-base text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              placeholder="E-mail"
              type="email"
              autoComplete="username"
            />
            <input
              value={loginForm.senha}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, senha: e.target.value }))}
              className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-5 text-base text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              placeholder="Senha"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {loginErro && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{loginErro}</p>}

          <button type="submit" disabled={loginCarregando} className="mt-6 h-14 w-full rounded-xl bg-[#02071a] px-5 text-base font-semibold text-white transition hover:bg-[#08265f] disabled:cursor-not-allowed disabled:opacity-70">
            {loginCarregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-950 lg:bg-slate-100">
      <main className="grid min-h-screen lg:grid-cols-[335px_minmax(0,1fr)]">
        <aside className="bg-white px-7 py-7 text-[#08265f] lg:min-h-screen">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.34em] text-sky-700">TR EVENTOS</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-black">Sistema interno</h1>
          </div>

          <div className="mt-12 space-y-5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full rounded-[14px] px-5 py-4 text-left text-xl leading-none transition ${view === item.id ? "bg-[#02071a] text-white" : "text-[#08265f] hover:bg-slate-100"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Departamento ativo</p>
            <select value={departamentoAtivo} onChange={(e) => setDepartamentoAtivo(e.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
              <option>Administração</option>
              <option>Financeiro</option>
              <option>Atendimento</option>
              <option>Contratos</option>
              <option>Eventos</option>
            </select>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-[#08265f]">
              <span className="rounded-lg bg-white px-3 py-2">Usuários</span>
              <span className="rounded-lg bg-white px-3 py-2">Permissões</span>
              <span className="rounded-lg bg-white px-3 py-2">Departamentos</span>
              <span className="rounded-lg bg-white px-3 py-2">Configurações</span>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-slate-100 p-4 sm:p-6">
          <header className="border-b border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${healthStatus.checked ? (healthStatus.serverOnline ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700") : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${healthStatus.checked ? (healthStatus.serverOnline ? "bg-emerald-600" : "bg-rose-600") : "bg-slate-400"}`} />
                  {healthStatus.checked ? (healthStatus.serverOnline ? "Servidor online" : "Servidor offline") : "Servidor verificando"}
                </div>
                <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${healthStatus.checked ? (healthStatus.databaseOnline ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700") : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${healthStatus.checked ? (healthStatus.databaseOnline ? "bg-emerald-600" : "bg-rose-600") : "bg-slate-400"}`} />
                  {healthStatus.checked ? (healthStatus.databaseOnline ? "Banco online" : "Banco offline") : "Banco verificando"}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900">
                  {dataPainel}
                </div>
                <button type="button" onClick={executarBackup} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Backup local
                </button>
                <button type="button" onClick={sair} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Sair
                </button>
              </div>
              {!infraOnline && healthStatus.checked && (
                <p className="text-sm font-semibold text-rose-700">Salvamento bloqueado ate servidor e banco ficarem online.</p>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Administracao</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{currentNav.label}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Alunos</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{indicadores.totalAlunos}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Em aberto</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{financeiroResumo.emAberto}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Tarefas</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{totalTarefasAbertas}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Usuarios</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{totalUsuarios}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-4 space-y-4">
            {view === "menu" && menuInicialInterativo()}
            {view === "aluno" && cadastroAluno()}
            {view === "alunos" && consultaAlunos()}
            {view === "escola" && cadastroEscola()}
            {view === "escolas" && consultaEscolas()}
            {view === "financeiro" && financeiroView()}
            {view === "tarefas" && tarefasView()}
            {view === "usuarios" && usuariosView()}
          </div>
        </section>
      </main>
      {demandaRemovida && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-slate-900">Tarefa apagada.</p>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={desfazerRemocaoDemanda} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
              Desfazer
            </button>
            <button type="button" onClick={() => setDemandaRemovida(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



