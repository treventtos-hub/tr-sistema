"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ViewMode = "menu" | "aluno" | "alunos" | "escola" | "escolas";
type ServicoFiltro = "todos" | "baile" | "kit" | "homenagem" | "replica";

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

type ObservacaoAluno = {
  id: number;
  texto: string;
  dataCriacao?: string;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/+$/, "");
type SalvamentoStatus = "idle" | "saving" | "saved" | "error";
type BackupStatus = "idle" | "running" | "done" | "error";
type Credenciais = {
  email: string;
  senha: string;
};

const loginStorageKey = "tr-sistema-login";

function carregarLoginSalvo() {
  if (typeof window === "undefined") return null;

  const salvo = window.localStorage.getItem(loginStorageKey);
  if (!salvo) return null;

  try {
    const loginSalvo = JSON.parse(salvo) as Credenciais;
    return loginSalvo.email && loginSalvo.senha ? loginSalvo : null;
  } catch {
    window.localStorage.removeItem(loginStorageKey);
    return null;
  }
}

export default function Home() {
  const [credenciais, setCredenciais] = useState<Credenciais | null>(() => carregarLoginSalvo());
  const [loginForm, setLoginForm] = useState(() => carregarLoginSalvo() || { email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [view, setView] = useState<ViewMode>("menu");
  const [sistemaAtivo, setSistemaAtivo] = useState(false);
  const [salvamentoStatus, setSalvamentoStatus] = useState<SalvamentoStatus>("idle");
  const [backupStatus, setBackupStatus] = useState<BackupStatus>("idle");
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
  const [pagamentoSearch, setPagamentoSearch] = useState({ nome: "", responsavel: "", escola: "" });
  const [resultadoPagamentoVisivel, setResultadoPagamentoVisivel] = useState(false);
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
  const [observacoesAluno, setObservacoesAluno] = useState<ObservacaoAluno[]>([]);
  const [novaObservacao, setNovaObservacao] = useState("");
  const [alunoFinanceiro, setAlunoFinanceiro] = useState<Aluno | null>(null);
  const [pagamentosFinanceiro, setPagamentosFinanceiro] = useState<Pagamento[]>([]);
  const [comissaoAlunoDetalhe, setComissaoAlunoDetalhe] = useState<ComissaoFormatura | null>(null);
  const [alunoEscolaFiltro, setAlunoEscolaFiltro] = useState("");
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const [escolaEditando, setEscolaEditando] = useState<Escola | null>(null);
  const [mostrarAlunosEscola, setMostrarAlunosEscola] = useState(false);
  const [servicoEscolaFiltro, setServicoEscolaFiltro] = useState<ServicoFiltro>("todos");

  useEffect(() => {
    if (!credenciais) return;

    const headers = {
      Authorization: `Basic ${window.btoa(`${credenciais.email}:${credenciais.senha}`)}`
    };

    function encerrarSessao() {
      setCredenciais(null);
      setSistemaAtivo(false);
      window.localStorage.removeItem(loginStorageKey);
    }

    async function carregarDadosIniciais() {
      try {
        const [alunosResponse, escolasResponse, sistemaResponse] = await Promise.all([
          fetch(`${apiUrl}/alunos`, { headers }),
          fetch(`${apiUrl}/escolas`, { headers }),
          fetch(`${apiUrl}/`, { cache: "no-store", headers })
        ]);

        if (alunosResponse.status === 401 || escolasResponse.status === 401 || sistemaResponse.status === 401) {
          encerrarSessao();
          return;
        }

        setSistemaAtivo(sistemaResponse.ok);

        if (alunosResponse.ok) {
          setAlunos(await alunosResponse.json());
        }

        if (escolasResponse.ok) {
          setEscolas(await escolasResponse.json());
        }
      } catch {
        setSistemaAtivo(false);
      }
    }

    async function checarSistema() {
      try {
        const response = await fetch(`${apiUrl}/`, { cache: "no-store", headers });
        if (response.status === 401) {
          encerrarSessao();
          return;
        }
        setSistemaAtivo(response.ok);
      } catch {
        setSistemaAtivo(false);
      }
    }

    void carregarDadosIniciais();

    const intervalo = window.setInterval(checarSistema, 15000);
    return () => window.clearInterval(intervalo);
  }, [credenciais]);

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
      .sort(compararPorTurmaENome);
  }, [alunos, alunoEscolaFiltro]);
  const alunosDaEscolaDetalhe = useMemo(() => {
    return alunos
      .filter((aluno) => aluno.escola === escolaDetalhe?.nomeEscola)
      .sort(compararPorTurmaENome);
  }, [alunos, escolaDetalhe]);
  const alunosDaEscolaPorServico = useMemo(() => {
    return alunosDaEscolaDetalhe.filter((aluno) => {
      if (servicoEscolaFiltro === "baile") return Boolean(aluno.baile);
      if (servicoEscolaFiltro === "kit") return Boolean(aluno.kitFormatura);
      if (servicoEscolaFiltro === "homenagem") return Boolean(aluno.placaHomenagem);
      if (servicoEscolaFiltro === "replica") return Boolean(aluno.placaReplica);
      return true;
    });
  }, [alunosDaEscolaDetalhe, servicoEscolaFiltro]);
  const resumoServicosEscola = useMemo(() => {
    const totalBaile = alunosDaEscolaDetalhe.filter((aluno) => aluno.baile).length;
    const totalKit = alunosDaEscolaDetalhe.filter((aluno) => aluno.kitFormatura).length;
    const alunosHomenagem = alunosDaEscolaDetalhe.filter((aluno) => aluno.placaHomenagem);
    const alunosReplica = alunosDaEscolaDetalhe.filter((aluno) => aluno.placaReplica);
    const totalHomenagem = alunosHomenagem.length;
    const totalReplica = alunosReplica.length;
    const quantidadeHomenagem = alunosHomenagem.reduce((total, aluno) => total + Number(aluno.quantidadePlacaHomenagem || 1), 0);
    const quantidadeReplica = alunosReplica.reduce((total, aluno) => total + Number(aluno.quantidadePlacaReplica || 1), 0);

    return {
      baile: {
        alunos: totalBaile,
        quantidade: totalBaile,
        total: totalBaile * Number(escolaDetalhe?.valorBaile || 0)
      },
      kit: {
        alunos: totalKit,
        quantidade: totalKit,
        total: totalKit * Number(escolaDetalhe?.valorKitFormatura || 0)
      },
      homenagem: {
        alunos: totalHomenagem,
        quantidade: quantidadeHomenagem,
        total: quantidadeHomenagem * Number(escolaDetalhe?.valorPlacaHomenagem || 0)
      },
      replica: {
        alunos: totalReplica,
        quantidade: quantidadeReplica,
        total: quantidadeReplica * Number(escolaDetalhe?.valorPlacaReplica || 0)
      }
    };
  }, [alunosDaEscolaDetalhe, escolaDetalhe]);
  const alunosPagamentoFiltrados = useMemo(() => {
    const nome = pagamentoSearch.nome.trim().toLocaleLowerCase("pt-BR");
    const responsavel = pagamentoSearch.responsavel.trim().toLocaleLowerCase("pt-BR");
    const escola = pagamentoSearch.escola.trim().toLocaleLowerCase("pt-BR");

    return alunos
      .filter((aluno) => {
        const nomeAluno = (aluno.nome || "").toLocaleLowerCase("pt-BR");
        const nomeResponsavel = (aluno.nomeResponsavel || "").toLocaleLowerCase("pt-BR");
        const nomeEscola = (aluno.escola || "").toLocaleLowerCase("pt-BR");

        return (
          (!nome || nomeAluno.includes(nome)) &&
          (!responsavel || nomeResponsavel.includes(responsavel)) &&
          (!escola || nomeEscola.includes(escola))
        );
      })
      .sort(compararPorTurmaENome);
  }, [alunos, pagamentoSearch]);

  function moeda(valor?: number | string) {
    const numero = Number(valor || 0);
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function parseMoney(valor: string) {
    return valor ? parseFloat(valor) : 0;
  }

  function authHeaders(credencialAtual = credenciais) {
    if (!credencialAtual) return {};

    return {
      Authorization: `Basic ${window.btoa(`${credencialAtual.email}:${credencialAtual.senha}`)}`
    };
  }

  async function apiFetch(url: string, init: RequestInit = {}, credencialAtual = credenciais) {
    const headers = new Headers(init.headers);
    const auth = authHeaders(credencialAtual);

    Object.entries(auth).forEach(([key, value]) => headers.set(key, value));

    const response = await fetch(url, { ...init, headers });

    if (response.status === 401) {
      sair();
    }

    return response;
  }

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginErro("");

    const credencialAtual = {
      email: loginForm.email.trim(),
      senha: loginForm.senha.trim()
    };

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credencialAtual)
      });

      if (!response.ok) {
        setLoginErro("Login ou senha incorretos.");
        return;
      }

      setCredenciais(credencialAtual);
      window.localStorage.setItem(loginStorageKey, JSON.stringify(credencialAtual));
    } catch {
      setLoginErro("Nao foi possivel conectar com a API.");
    }
  }

  function sair() {
    setCredenciais(null);
    setSistemaAtivo(false);
    window.localStorage.removeItem(loginStorageKey);
  }

  async function enviarAlteracao(url: string, init: RequestInit) {
    setSalvamentoStatus("saving");

    try {
      const response = await apiFetch(url, init);
      setSalvamentoStatus(response.ok ? "saved" : "error");
      window.setTimeout(() => setSalvamentoStatus("idle"), 3000);
      return response;
    } catch (error) {
      setSalvamentoStatus("error");
      window.setTimeout(() => setSalvamentoStatus("idle"), 3000);
      throw error;
    }
  }

  async function fazerBackupManual() {
    setBackupStatus("running");

    try {
      const response = await apiFetch(`${apiUrl}/backup`, { method: "POST" });
      setBackupStatus(response.ok ? "done" : "error");
    } catch {
      setBackupStatus("error");
    } finally {
      window.setTimeout(() => setBackupStatus("idle"), 5000);
    }
  }

  function compararPorTurmaENome(a: Aluno, b: Aluno) {
    const turmaA = a.turma?.trim() || "zzzz";
    const turmaB = b.turma?.trim() || "zzzz";
    const ordemTurma = turmaA.localeCompare(turmaB, "pt-BR", { numeric: true, sensitivity: "base" });

    if (ordemTurma !== 0) return ordemTurma;

    return a.nome.localeCompare(b.nome, "pt-BR", { numeric: true, sensitivity: "base" });
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

    const response = await enviarAlteracao(alunoEditando ? `${apiUrl}/alunos/${alunoEditando.id}` : `${apiUrl}/alunos`, {
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

    const response = await enviarAlteracao(escolaEditando ? `${apiUrl}/escolas/${escolaEditando.id}` : `${apiUrl}/escolas`, {
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
    setObservacoesAluno([]);
    setNovaObservacao("");
    setAlunoFinanceiro(null);
    setComissaoAlunoDetalhe(null);

    carregarObservacoesAluno(aluno.id);

    const response = await apiFetch(`${apiUrl}/comissao-formatura/aluno/${aluno.id}`);
    if (response.ok) {
      const comissoes = await response.json();
      setComissaoAlunoDetalhe(comissoes[0] || null);
    }
  }

  async function carregarObservacoesAluno(alunoId: number) {
    const response = await apiFetch(`${apiUrl}/alunos/${alunoId}/observacoes`);
    if (!response.ok) {
      alert("Nao foi possivel carregar as observacoes deste aluno.");
      return;
    }

    setObservacoesAluno(await response.json());
  }

  async function salvarObservacaoAluno() {
    if (!alunoDetalhe) return;
    if (!novaObservacao.trim()) {
      alert("Escreva uma observacao antes de salvar.");
      return;
    }

    const response = await enviarAlteracao(`${apiUrl}/alunos/${alunoDetalhe.id}/observacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novaObservacao })
    });
    if (!response.ok) {
      alert("Nao foi possivel salvar a observacao.");
      return;
    }

    setNovaObservacao("");
    carregarObservacoesAluno(alunoDetalhe.id);
  }

  async function excluirObservacaoAluno(observacaoId: number) {
    if (!alunoDetalhe) return;
    if (!window.confirm("Deseja excluir esta observacao?")) return;

    const response = await enviarAlteracao(`${apiUrl}/alunos/${alunoDetalhe.id}/observacoes/${observacaoId}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Nao foi possivel excluir a observacao.");
      return;
    }

    carregarObservacoesAluno(alunoDetalhe.id);
  }

  function abrirEscolaDoAluno(aluno: Aluno) {
    const escolaAluno = escolas.find((escola) => escola.nomeEscola === aluno.escola);
    if (!escolaAluno) {
      alert("Escola deste aluno nao encontrada.");
      return;
    }

    setEscolaDetalhe(escolaAluno);
    setMostrarAlunosEscola(false);
    setServicoEscolaFiltro("todos");
    setView("escolas");
  }

  async function abrirFinanceiroAluno(aluno: Aluno) {
    setAlunoFinanceiro(aluno);
    setPagamentosFinanceiro([]);
    setPagamento({ alunoId: aluno.id.toString(), valor: "" });
    setNumeroParcela("");
    setUltimoPagamento(null);

    const response = await apiFetch(`${apiUrl}/pagamentos/aluno/${aluno.id}`);
    if (!response.ok) {
      alert("Nao foi possivel carregar o financeiro deste aluno.");
      return;
    }

    const pagamentosAluno: Pagamento[] = await response.json();
    setPagamentosFinanceiro(
      pagamentosAluno.sort((a, b) => Number(a.numeroParcela || a.id || 0) - Number(b.numeroParcela || b.id || 0))
    );
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
    if (!comissaoForm.escolaId || !comissaoForm.alunoId) {
      alert("Selecione a escola e o aluno da comissao.");
      return;
    }

    const response = await enviarAlteracao(`${apiUrl}/comissao-formatura`, {
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

    const response = await enviarAlteracao(`${apiUrl}/alunos/${alunoId}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Nao foi possivel excluir este cadastro.");
      return;
    }

    if (alunoSelecionado?.id === alunoId) {
      setAlunoSelecionado(null);
      setPagamentos([]);
    }
    listarTodos();
  }

  async function excluirEscola(escolaId: number) {
    if (!window.confirm("Deseja realmente excluir esta escola?")) return;

    const response = await enviarAlteracao(`${apiUrl}/escolas/${escolaId}`, { method: "DELETE" });
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
    setPagamentoSearch({ nome: aluno.nome, responsavel: aluno.nomeResponsavel || "", escola: aluno.escola || "" });
    setResultadoPagamentoVisivel(false);
    setTimeout(() => {
      document.getElementById("conta-pagamento")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
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
    const response = await enviarAlteracao(`${apiUrl}/pagamentos`, {
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

    if (alunoSelecionado?.id === parseInt(pagamento.alunoId)) {
      carregarPagamentos(alunoSelecionado.id);
      const alunoResponse = await apiFetch(`${apiUrl}/alunos?nome=${encodeURIComponent(alunoSelecionado.nome)}`);
      const updatedAlunos = await alunoResponse.json();
      const atualizado = updatedAlunos.find((aluno: Aluno) => aluno.id === alunoSelecionado.id) || updatedAlunos[0];
      if (atualizado) setAlunoSelecionado(atualizado);
      listarTodos();
    }

    if (alunoFinanceiro?.id === parseInt(pagamento.alunoId)) {
      if (pagamentoSalvo.aluno) setAlunoFinanceiro(pagamentoSalvo.aluno);
      const pagamentosResponse = await apiFetch(`${apiUrl}/pagamentos/aluno/${pagamento.alunoId}`);
      const pagamentosAluno: Pagamento[] = await pagamentosResponse.json();
      setPagamentosFinanceiro(
        pagamentosAluno.sort((a, b) => Number(a.numeroParcela || a.id || 0) - Number(b.numeroParcela || b.id || 0))
      );
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
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-950">Escolha o cadastro</h2>
        <div className="mt-6 grid gap-4">
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
            <button type="button" onClick={() => { setView("aluno"); listarEscolas(); }} className="w-full rounded-3xl bg-sky-600 p-6 text-left text-white transition hover:bg-sky-700">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Cadastro</span>
              <span className="mt-3 block text-2xl font-semibold">Aluno</span>
            </button>
            <button type="button" onClick={() => { setView("alunos"); setAlunoDetalhe(null); setAlunoEscolaFiltro(""); listarTodos(); listarEscolas(); }} className="mt-4 w-full rounded-3xl border border-sky-200 bg-white px-5 py-4 text-left text-sm font-semibold text-sky-700 transition hover:bg-sky-100">Alunos cadastrados</button>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <button type="button" onClick={() => { setView("escola"); listarEscolas(); }} className="w-full rounded-3xl bg-emerald-600 p-6 text-left text-white transition hover:bg-emerald-700">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Cadastro</span>
              <span className="mt-3 block text-2xl font-semibold">Escola</span>
            </button>
            <button type="button" onClick={() => { setView("escolas"); setEscolaDetalhe(null); listarEscolas(); }} className="mt-4 w-full rounded-3xl border border-emerald-200 bg-white px-5 py-4 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">Escolas cadastradas</button>
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

        <div className="mt-5 grid gap-4 md:grid-cols-3">
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
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pagamento</p>
              <h4 className="mt-1 text-lg font-semibold text-slate-950">Registrar pagamento do aluno</h4>
            </div>
            {ultimoPagamento && (
              <button type="button" onClick={() => abrirRecibo(ultimoPagamento, ultimoPagamento.aluno || alunoFinanceiro)} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Gerar recibo</button>
            )}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_0.7fr_auto]">
            <input type="number" step="0.01" placeholder="Valor do pagamento (R$)" value={pagamento.alunoId === alunoFinanceiro.id.toString() ? pagamento.valor : ""} onChange={(e) => setPagamento({ alunoId: alunoFinanceiro.id.toString(), valor: e.target.value })} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="number" min="1" placeholder="N. da parcela" value={pagamento.alunoId === alunoFinanceiro.id.toString() ? numeroParcela : ""} onChange={(e) => { setPagamento(pagamento.alunoId === alunoFinanceiro.id.toString() ? { ...pagamento, alunoId: alunoFinanceiro.id.toString() } : { alunoId: alunoFinanceiro.id.toString(), valor: "" }); setNumeroParcela(e.target.value); }} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <button type="button" onClick={registrarPagamento} className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Confirmar pagamento</button>
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

  function contaPagamentoAluno() {
    return (
      <div id="conta-pagamento" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-950">Conta de pagamento</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input type="text" placeholder="Nome do aluno" value={pagamentoSearch.nome} onChange={(e) => { setPagamentoSearch({ ...pagamentoSearch, nome: e.target.value }); setResultadoPagamentoVisivel(true); }} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
          <input type="text" placeholder="Nome do responsavel" value={pagamentoSearch.responsavel} onChange={(e) => { setPagamentoSearch({ ...pagamentoSearch, responsavel: e.target.value }); setResultadoPagamentoVisivel(true); }} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
          <input type="text" placeholder="Escola" value={pagamentoSearch.escola} onChange={(e) => { setPagamentoSearch({ ...pagamentoSearch, escola: e.target.value }); setResultadoPagamentoVisivel(true); }} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setResultadoPagamentoVisivel(true)} className="rounded-3xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Buscar</button>
          <button type="button" onClick={() => { setPagamentoSearch({ nome: "", responsavel: "", escola: "" }); setResultadoPagamentoVisivel(false); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Limpar</button>
        </div>

        {resultadoPagamentoVisivel && (
          <div className="mt-4 max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50">
            {alunosPagamentoFiltrados.length > 0 ? (
              alunosPagamentoFiltrados.map((aluno) => (
                <button
                  key={aluno.id}
                  type="button"
                  onClick={() => {
                    selecionarAlunoParaPagamento(aluno);
                    setPagamentoSearch({ nome: aluno.nome, responsavel: aluno.nomeResponsavel || "", escola: aluno.escola || "" });
                    setResultadoPagamentoVisivel(false);
                  }}
                  className="block w-full border-b border-slate-200 px-4 py-3 text-left transition last:border-b-0 hover:bg-white"
                >
                  <span className="block text-sm font-semibold text-slate-950">{aluno.nome}</span>
                  <span className="mt-1 block text-xs text-slate-500">{aluno.nomeResponsavel || "-"} | {aluno.escola || "-"} | {aluno.turma || "-"}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-5 text-sm text-slate-500">Nenhum aluno encontrado para pagamento.</div>
            )}
          </div>
        )}

        {alunoSelecionado ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Aluno</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{alunoSelecionado.nome}</p>
              <p className="mt-1 text-sm text-slate-500">{alunoSelecionado.telefone}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Valor total</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorTotalContrato)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Falta quitar</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorRestanteContrato)}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" step="0.01" placeholder="Valor do pagamento (R$)" value={pagamento.valor} onChange={(e) => setPagamento({ ...pagamento, valor: e.target.value })} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="number" min="1" placeholder="N. da parcela" value={numeroParcela} onChange={(e) => setNumeroParcela(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={registrarPagamento} className="flex-1 rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Confirmar pagamento</button>
              <button type="button" onClick={() => abrirRecibo(ultimoPagamento, alunoSelecionado)} className="flex-1 rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Gerar recibo</button>
              <button type="button" onClick={() => setAlunoSelecionado(null)} className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Fechar</button>
            </div>
            {pagamentos.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-950">Historico de pagamentos</h3>
                <div className="mt-4 space-y-3">
                  {pagamentos.map((pag) => (
                    <div key={pag.id} className="rounded-3xl bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Parcela {pag.numeroParcela || 0}</p>
                          <p className="text-lg font-semibold text-slate-950">{moeda(pag.valor)}</p>
                        </div>
                        <button type="button" onClick={() => abrirRecibo(pag, pag.aluno || alunoSelecionado)} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Recibo</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-slate-600">Selecione um aluno acima ou clique em Pagamento na lista de alunos.</div>
        )}
      </div>
    );
  }

  function buscaAlunosInicio() {
    return (
      <section className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-950">Buscar alunos</h2>
            <div className="mt-6 grid gap-4">
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

          {contaPagamentoAluno()}
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
                          <button type="button" onClick={() => abrirPagamentoAluno(aluno)} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Pagamento</button>
                          <button type="button" onClick={() => abrirResumoFinanceiro(aluno)} className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Resumo financeiro</button>
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
          <button type="button" onClick={() => { setView("menu"); setAlunoDetalhe(null); setComissaoAlunoDetalhe(null); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
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
              <h4 className="text-lg font-semibold text-slate-950">Observacoes</h4>
              <div className="mt-4 grid gap-3">
                <textarea
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  placeholder="Escreva uma nova observacao sobre este aluno"
                  rows={3}
                  className="w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={salvarObservacaoAluno} className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Salvar observacao</button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {observacoesAluno.length > 0 ? (
                  observacoesAluno.map((observacao) => (
                    <div key={observacao.id} className="rounded-3xl bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{observacao.dataCriacao ? new Date(observacao.dataCriacao).toLocaleString("pt-BR") : "-"}</p>
                          <p className="mt-2 whitespace-pre-wrap text-slate-800">{observacao.texto}</p>
                        </div>
                        <button type="button" onClick={() => excluirObservacaoAluno(observacao.id)} className="rounded-3xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">Excluir</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-white p-4 text-sm text-slate-500">Nenhuma observacao cadastrada.</div>
                )}
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
          <button type="button" onClick={() => { setView("menu"); setEscolaDetalhe(null); setMostrarAlunosEscola(false); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
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
                  <h4 className="text-lg font-semibold text-slate-950">Resumo de servicos da escola</h4>
                  <p className="mt-1 text-sm text-slate-600">Clique em um servico para filtrar a lista de alunos.</p>
                </div>
                <button type="button" onClick={() => { setServicoEscolaFiltro("todos"); setMostrarAlunosEscola(true); listarTodos(); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Todos os alunos</button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <button type="button" onClick={() => { setServicoEscolaFiltro("baile"); setMostrarAlunosEscola(true); }} className={`rounded-3xl p-5 text-left transition ${servicoEscolaFiltro === "baile" ? "bg-sky-600 text-white" : "bg-sky-50 text-slate-950 hover:bg-sky-100"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${servicoEscolaFiltro === "baile" ? "text-sky-100" : "text-sky-700"}`}>Baile</p>
                  <p className="mt-2 text-2xl font-semibold">{resumoServicosEscola.baile.alunos} alunos</p>
                  <p className="mt-1 text-sm">Total: {moeda(resumoServicosEscola.baile.total)}</p>
                </button>
                <button type="button" onClick={() => { setServicoEscolaFiltro("kit"); setMostrarAlunosEscola(true); }} className={`rounded-3xl p-5 text-left transition ${servicoEscolaFiltro === "kit" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-slate-950 hover:bg-emerald-100"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${servicoEscolaFiltro === "kit" ? "text-emerald-100" : "text-emerald-700"}`}>Kit formatura</p>
                  <p className="mt-2 text-2xl font-semibold">{resumoServicosEscola.kit.alunos} alunos</p>
                  <p className="mt-1 text-sm">Total: {moeda(resumoServicosEscola.kit.total)}</p>
                </button>
                <button type="button" onClick={() => { setServicoEscolaFiltro("homenagem"); setMostrarAlunosEscola(true); }} className={`rounded-3xl p-5 text-left transition ${servicoEscolaFiltro === "homenagem" ? "bg-violet-600 text-white" : "bg-violet-50 text-slate-950 hover:bg-violet-100"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${servicoEscolaFiltro === "homenagem" ? "text-violet-100" : "text-violet-700"}`}>Placa homenagem</p>
                  <p className="mt-2 text-2xl font-semibold">{resumoServicosEscola.homenagem.alunos} alunos</p>
                  <p className="mt-1 text-sm">{resumoServicosEscola.homenagem.quantidade} placas | {moeda(resumoServicosEscola.homenagem.total)}</p>
                </button>
                <button type="button" onClick={() => { setServicoEscolaFiltro("replica"); setMostrarAlunosEscola(true); }} className={`rounded-3xl p-5 text-left transition ${servicoEscolaFiltro === "replica" ? "bg-amber-600 text-white" : "bg-amber-50 text-slate-950 hover:bg-amber-100"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${servicoEscolaFiltro === "replica" ? "text-amber-100" : "text-amber-700"}`}>Placa replica</p>
                  <p className="mt-2 text-2xl font-semibold">{resumoServicosEscola.replica.alunos} alunos</p>
                  <p className="mt-1 text-sm">{resumoServicosEscola.replica.quantidade} placas | {moeda(resumoServicosEscola.replica.total)}</p>
                </button>
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Total calculado dos servicos filtraveis</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {moeda(resumoServicosEscola.baile.total + resumoServicosEscola.kit.total + resumoServicosEscola.homenagem.total + resumoServicosEscola.replica.total)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">Alunos desta escola</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {servicoEscolaFiltro === "todos" ? "Lista ligada ao cadastro da escola selecionada." : `Filtro ativo: ${servicoEscolaFiltro}.`}
                  </p>
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
                        <th className="px-5 py-4 font-medium">Servicos</th>
                        <th className="px-5 py-4 font-medium">Contrato</th>
                        <th className="px-5 py-4 font-medium">Restante</th>
                        <th className="px-5 py-4 font-medium">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosDaEscolaPorServico.length > 0 ? (
                        alunosDaEscolaPorServico.map((aluno) => (
                          <tr key={aluno.id} className="border-t border-slate-200 hover:bg-slate-50">
                            <td className="px-5 py-4">{aluno.nome}</td>
                            <td className="px-5 py-4">{aluno.nomeResponsavel || "-"}</td>
                            <td className="px-5 py-4">{aluno.turma || "-"}</td>
                            <td className="px-5 py-4">
                              {[
                                aluno.baile ? "Baile" : "",
                                aluno.kitFormatura ? "Kit" : "",
                                aluno.placaHomenagem ? `Homenagem x${aluno.quantidadePlacaHomenagem || 1}` : "",
                                aluno.placaReplica ? `Replica x${aluno.quantidadePlacaReplica || 1}` : ""
                              ].filter(Boolean).join(", ") || "-"}
                            </td>
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
                          <td colSpan={7} className="px-5 py-6 text-center text-slate-500">Nenhum aluno encontrado para este filtro.</td>
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
                        <button type="button" onClick={() => { setEscolaDetalhe(escola); setMostrarAlunosEscola(false); setServicoEscolaFiltro("todos"); listarTodos(); }} className="rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Abrir cadastro</button>
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
          <button type="button" onClick={salvarEscola} className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">{escolaEditando ? "Atualizar escola" : "Salvar escola"}</button>
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
              <button type="button" onClick={salvarComissao} disabled={!comissaoForm.escolaId || !comissaoForm.alunoId} className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Adicionar aluno</button>
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
      <section className="space-y-6">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{alunoEditando ? "Editar aluno" : "Cadastro de aluno"}</h2>
                <p className="mt-2 text-slate-600">{alunoEditando ? "Atualize os dados, escola, turma, servicos e parcelas." : "Crie novos alunos e defina o valor mensal automaticamente."}</p>
              </div>
              <button type="button" onClick={() => { resetAlunoForm(); setView("menu"); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input type="text" placeholder="Nome do aluno" value={alunoForm.nome} onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="tel" placeholder="Telefone do aluno" value={alunoForm.telefone} onChange={(e) => setAlunoForm({ ...alunoForm, telefone: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="text" placeholder="Nome do responsavel" value={alunoForm.nomeResponsavel} onChange={(e) => setAlunoForm({ ...alunoForm, nomeResponsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="tel" placeholder="Telefone do responsavel" value={alunoForm.telefoneResponsavel} onChange={(e) => setAlunoForm({ ...alunoForm, telefoneResponsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <select value={alunoForm.escolaId} onChange={(e) => setAlunoForm({ ...alunoForm, escolaId: e.target.value, escola: escolas.find((escola) => escola.id.toString() === e.target.value)?.nomeEscola || "" })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                <option value="">Selecione a escola</option>
                {escolas.map((escola) => (
                  <option key={escola.id} value={escola.id}>{escola.nomeEscola}</option>
                ))}
              </select>
              <input type="text" placeholder="Turma" value={alunoForm.turma} onChange={(e) => setAlunoForm({ ...alunoForm, turma: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <select value={alunoForm.formaPagamento} onChange={(e) => setAlunoForm({ ...alunoForm, formaPagamento: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                <option value="">Forma de pagamento</option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartao de credito">Cartao de credito</option>
                <option value="Cartao de debito">Cartao de debito</option>
              </select>
              <input type="number" placeholder="Parcelas" value={alunoForm.parcelas} onChange={(e) => setAlunoForm({ ...alunoForm, parcelas: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <div className="rounded-3xl bg-slate-100 p-4"><span className="text-sm uppercase tracking-[0.24em] text-slate-500">Valor do contrato</span><p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorContratoAluno)}</p></div>
              <div className="rounded-3xl bg-slate-100 p-4"><span className="text-sm uppercase tracking-[0.24em] text-slate-500">Valor mensal</span><p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorMensalPreview)}</p></div>
            </div>
            {escolas.length === 0 && (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                Cadastre uma escola primeiro para puxar os valores dos servicos.
              </div>
            )}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-950">Servicos do aluno</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={alunoForm.baile} onChange={(e) => setAlunoForm({ ...alunoForm, baile: e.target.checked })} className="h-5 w-5 rounded border-slate-300 accent-sky-600" />
                  Baile {escolaSelecionada ? `(${moeda(escolaSelecionada.valorBaile)})` : ""}
                </label>
                <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={alunoForm.kitFormatura} onChange={(e) => setAlunoForm({ ...alunoForm, kitFormatura: e.target.checked })} className="h-5 w-5 rounded border-slate-300 accent-sky-600" />
                  Kit Formatura {escolaSelecionada ? `(${moeda(escolaSelecionada.valorKitFormatura)})` : ""}
                </label>
                <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={alunoForm.placaHomenagem} onChange={(e) => setAlunoForm({ ...alunoForm, placaHomenagem: e.target.checked, quantidadePlacaHomenagem: e.target.checked ? alunoForm.quantidadePlacaHomenagem : "1" })} className="h-5 w-5 rounded border-slate-300 accent-sky-600" />
                  Placa de homenagem {escolaSelecionada ? `(${moeda(escolaSelecionada.valorPlacaHomenagem)} cada)` : ""}
                </label>
                <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={alunoForm.placaReplica} onChange={(e) => setAlunoForm({ ...alunoForm, placaReplica: e.target.checked, quantidadePlacaReplica: e.target.checked ? alunoForm.quantidadePlacaReplica : "1" })} className="h-5 w-5 rounded border-slate-300 accent-sky-600" />
                  Placa replica {escolaSelecionada ? `(${moeda(escolaSelecionada.valorPlacaReplica)} cada)` : ""}
                </label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {alunoForm.placaHomenagem && (
                  <input type="number" min="1" placeholder="Quantidade de placas" value={alunoForm.quantidadePlacaHomenagem} onChange={(e) => setAlunoForm({ ...alunoForm, quantidadePlacaHomenagem: e.target.value })} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
                )}
                {alunoForm.placaReplica && (
                  <input type="number" min="1" placeholder="Quantidade de placas replica" value={alunoForm.quantidadePlacaReplica} onChange={(e) => setAlunoForm({ ...alunoForm, quantidadePlacaReplica: e.target.value })} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={salvarAluno} disabled={!escolaSelecionada} className="rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300">{alunoEditando ? "Atualizar aluno" : "Salvar aluno"}</button>
              {alunoEditando && (
                <button type="button" onClick={resetAlunoForm} className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar edicao</button>
              )}
            </div>
          </div>

        </div>
      </section>
    );
  }

  function telaLogin() {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Painel TR</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Entrar no sistema</h1>
          </div>

          <form onSubmit={entrar} className="mt-8 space-y-4">
            <input
              type="email"
              placeholder="Login"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              autoComplete="username"
              required
            />
            <div className="flex rounded-3xl border border-slate-200 bg-slate-50 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200">
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha"
                value={loginForm.senha}
                onChange={(event) => setLoginForm({ ...loginForm, senha: event.target.value })}
                className="min-w-0 flex-1 rounded-l-3xl bg-transparent px-4 py-3 text-slate-900 outline-none"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                className="rounded-r-3xl px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {loginErro && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {loginErro}
              </div>
            )}
            <button type="submit" className="w-full rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
              Entrar
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (!credenciais) {
    return telaLogin();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <div className="fixed left-4 top-4 z-50 rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-lg shadow-slate-200/70 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <span className={`h-3 w-3 rounded-full ${sistemaAtivo ? "bg-emerald-500" : "bg-rose-500"}`} />
          Sistema {sistemaAtivo ? "ativo" : "inativo"}
        </div>
        <div className={`mt-1 text-xs font-medium ${salvamentoStatus === "error" ? "text-rose-700" : salvamentoStatus === "saving" ? "text-sky-700" : salvamentoStatus === "saved" ? "text-emerald-700" : "text-slate-500"}`}>
          {salvamentoStatus === "saving" && "Salvando..."}
          {salvamentoStatus === "saved" && "Salvamento concluido"}
          {salvamentoStatus === "error" && "Falha ao salvar"}
          {salvamentoStatus === "idle" && "Pronto para salvar"}
        </div>
      </div>
      <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={sair}
          className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200/70 backdrop-blur transition hover:bg-slate-50"
        >
          Sair
        </button>
        <button
          type="button"
          onClick={fazerBackupManual}
          disabled={backupStatus === "running"}
          className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/70 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {backupStatus === "running" ? "Fazendo backup..." : "Fazer backup"}
        </button>
        {backupStatus !== "idle" && (
          <div className={`rounded-3xl border bg-white/95 px-4 py-2 text-xs font-semibold shadow-md backdrop-blur ${backupStatus === "done" ? "border-emerald-200 text-emerald-700" : backupStatus === "error" ? "border-rose-200 text-rose-700" : "border-sky-200 text-sky-700"}`}>
            {backupStatus === "running" && "Salvando backup no OneDrive..."}
            {backupStatus === "done" && "Backup concluido"}
            {backupStatus === "error" && "Falha no backup"}
          </div>
        )}
      </div>
      <main className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Painel TR</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">CRM de Alunos</h1>
              <p className="max-w-2xl text-slate-600">Cadastro de alunos, escolas e controle de pagamentos.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Alunos</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{indicadores.totalAlunos}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Escolas</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{indicadores.totalEscolas}</p>
              </div>
            </div>
          </div>
        </header>

        {buscaAlunosInicio()}
        {painelFinanceiroAluno()}

        {view === "menu" && menuInicial()}
        {view === "aluno" && cadastroAluno()}
        {view === "alunos" && consultaAlunos()}
        {view === "escola" && cadastroEscola()}
        {view === "escolas" && consultaEscolas()}
      </main>
    </div>
  );
}
