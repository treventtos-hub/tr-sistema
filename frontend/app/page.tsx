"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

type ViewMode = "menu" | "aluno" | "alunos" | "escola" | "escolas" | "cobrancas" | "usuarios" | "manutencao";

type Aluno = {
  id: number;
  nome: string;
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
  telefone?: string;
  escola?: string;
  turma?: string;
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

type CobrancaStatus = "AGUARDANDO_RESPOSTA" | "RESOLVIDO" | "COBRAR_NOVAMENTE_15_DIAS";

type Cobranca = {
  id: number;
  alunoId: number;
  nomeAluno?: string;
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
  escola?: string;
  turma?: string;
  status: CobrancaStatus;
  observacao?: string;
  dataCobranca?: string;
  dataLembrete?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  criadoPor?: string;
  atualizadoPor?: string;
};

type Usuario = {
  id: number;
  nome: string;
  login: string;
  perfil?: string;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  sessaoToken?: string;
};

type TabelaManutencao = {
  tabela: string;
  linhas: number;
  tamanhoBytes: number;
  tamanhoTotal: string;
};

type ManutencaoStatus = {
  statusLotacao: string;
  usoEstimado: string;
  registros: number;
  anoSelecionado: number;
  lembrete: string;
  tabelas: TabelaManutencao[];
};

const cobrancaStatusOptions: { value: CobrancaStatus; label: string }[] = [
  { value: "AGUARDANDO_RESPOSTA", label: "Aguardando resposta" },
  { value: "RESOLVIDO", label: "Resolvido" },
  { value: "COBRAR_NOVAMENTE_15_DIAS", label: "Cobrar novamente em 15 dias" }
];

function dataISO(dias = 0) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export default function Home() {
  const [view, setView] = useState<ViewMode>("menu");
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => {
    if (typeof window === "undefined") return null;
    const usuarioSalvo = window.localStorage.getItem("tr_usuario");
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  });
  const [loginForm, setLoginForm] = useState({ login: "", senha: "" });
  const [novoUsuarioForm, setNovoUsuarioForm] = useState({ nome: "", login: "", senha: "", perfil: "OPERADOR" });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [alunoForm, setAlunoForm] = useState({
    nome: "",
    nomeResponsavel: "",
    telefoneResponsavel: "",
    telefone: "",
    escolaId: "",
    escola: "",
    turma: "",
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
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [cobrancaEditando, setCobrancaEditando] = useState<Cobranca | null>(null);
  const [cobrancaFiltroStatus, setCobrancaFiltroStatus] = useState("");
  const [comentariosCobranca, setComentariosCobranca] = useState<Record<number, string>>({});
  const [cobrancaForm, setCobrancaForm] = useState({
    alunoId: "",
    status: "AGUARDANDO_RESPOSTA" as CobrancaStatus,
    observacao: "",
    dataCobranca: dataISO(),
    dataLembrete: dataISO(15)
  });
  const [manutencaoStatus, setManutencaoStatus] = useState<ManutencaoStatus | null>(null);

  useEffect(() => {
    if (!usuarioLogado) return;
    listarTodos();
    listarEscolas();
    listarCobrancas();
    listarUsuarios();
    carregarManutencao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioLogado]);

  const indicadores = useMemo(() => {
    return {
      totalAlunos: alunos.length,
      totalEscolas: escolas.length,
      cobrancasPendentes: cobrancas.filter((cobranca) => cobranca.status !== "RESOLVIDO").length
    };
  }, [alunos, escolas, cobrancas]);

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
  const cobrancasFiltradas = useMemo(() => {
    return cobrancas.filter((cobranca) => !cobrancaFiltroStatus || cobranca.status === cobrancaFiltroStatus);
  }, [cobrancas, cobrancaFiltroStatus]);

  function moeda(valor?: number | string) {
    const numero = Number(valor || 0);
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function parseMoney(valor: string) {
    return valor ? parseFloat(valor) : 0;
  }

  function usuarioHeaders(): Record<string, string> {
    return usuarioLogado
      ? {
          Authorization: `Bearer ${usuarioLogado.sessaoToken || ""}`,
          "X-Usuario-Nome": usuarioLogado.nome,
          "X-Usuario-Login": usuarioLogado.login
        }
      : {};
  }

  async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const headers = {
      ...usuarioHeaders(),
      ...(init.headers as Record<string, string> | undefined)
    };
    return fetch(input, { ...init, headers });
  }

  async function entrar() {
    const response = await fetch(`${apiUrl}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm)
    });
    if (!response.ok) {
      alert("Login ou senha invalidos.");
      return;
    }
    const usuario = await response.json();
    setUsuarioLogado(usuario);
    window.localStorage.setItem("tr_usuario", JSON.stringify(usuario));
  }

  async function criarUsuario() {
    if (!novoUsuarioForm.login || !novoUsuarioForm.senha) {
      alert("Informe login e senha para criar o usuario.");
      return;
    }

    const response = await authFetch(`${apiUrl}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoUsuarioForm)
    });
    if (!response.ok) {
      alert("Nao foi possivel criar o usuario.");
      return;
    }

    alert("Usuario criado. Ele ja pode entrar pela tela inicial.");
    setNovoUsuarioForm({ nome: "", login: "", senha: "", perfil: "OPERADOR" });
    listarUsuarios();
  }

  async function listarUsuarios() {
    const response = await authFetch(`${apiUrl}/usuarios`);
    if (!response.ok) return;
    const data = await response.json();
    setUsuarios(data);
  }

  function sair() {
    window.localStorage.removeItem("tr_usuario");
    setUsuarioLogado(null);
    setView("menu");
  }

  function resetAlunoForm() {
    setAlunoForm({ nome: "", nomeResponsavel: "", telefoneResponsavel: "", telefone: "", escolaId: "", escola: "", turma: "", parcelas: "", baile: false, kitFormatura: false, placaHomenagem: false, quantidadePlacaHomenagem: "1", placaReplica: false, quantidadePlacaReplica: "1" });
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

  function resetCobrancaForm() {
    setCobrancaForm({
      alunoId: "",
      status: "AGUARDANDO_RESPOSTA",
      observacao: "",
      dataCobranca: dataISO(),
      dataLembrete: dataISO(15)
    });
    setCobrancaEditando(null);
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

    const response = await authFetch(alunoEditando ? `${apiUrl}/alunos/${alunoEditando.id}` : `${apiUrl}/alunos`, {
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

    const response = await authFetch(escolaEditando ? `${apiUrl}/escolas/${escolaEditando.id}` : `${apiUrl}/escolas`, {
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
    const response = await authFetch(`${apiUrl}/alunos${params.toString() ? `?${params.toString()}` : ""}`);
    setAlunos(await response.json());
    setResultadoBuscaVisivel(true);
  }

  async function listarTodos() {
    const response = await authFetch(`${apiUrl}/alunos`);
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
    const response = await authFetch(`${apiUrl}/escolas`);
    setEscolas(await response.json());
  }

  async function listarCobrancas() {
    const response = await authFetch(`${apiUrl}/cobrancas`);
    if (!response.ok) {
      alert("Nao foi possivel carregar as cobrancas.");
      return;
    }
    setCobrancas(await response.json());
  }

  async function salvarCobranca() {
    if (!cobrancaForm.alunoId) {
      alert("Selecione o aluno cobrado.");
      return;
    }

    const dataToSave = {
      alunoId: parseInt(cobrancaForm.alunoId),
      status: cobrancaForm.status,
      observacao: cobrancaForm.observacao,
      dataCobranca: cobrancaForm.dataCobranca,
      dataLembrete: cobrancaForm.status === "RESOLVIDO" ? null : cobrancaForm.dataLembrete
    };

    const response = await authFetch(cobrancaEditando ? `${apiUrl}/cobrancas/${cobrancaEditando.id}` : `${apiUrl}/cobrancas`, {
      method: cobrancaEditando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...usuarioHeaders() },
      body: JSON.stringify(dataToSave)
    });

    if (!response.ok) {
      alert(cobrancaEditando ? "Nao foi possivel editar a cobranca." : "Nao foi possivel registrar a cobranca.");
      return;
    }

    alert(cobrancaEditando ? "Cobranca atualizada!" : "Cobranca registrada!");
    resetCobrancaForm();
    listarCobrancas();
  }

  function editarCobranca(cobranca: Cobranca) {
    setCobrancaEditando(cobranca);
    setCobrancaForm({
      alunoId: cobranca.alunoId.toString(),
      status: cobranca.status,
      observacao: cobranca.observacao || "",
      dataCobranca: cobranca.dataCobranca || dataISO(),
      dataLembrete: cobranca.dataLembrete || dataISO(15)
    });
    setView("cobrancas");
  }

  async function atualizarStatusCobranca(cobranca: Cobranca, status: CobrancaStatus) {
    const response = await authFetch(`${apiUrl}/cobrancas/${cobranca.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...usuarioHeaders() },
      body: JSON.stringify({
        alunoId: cobranca.alunoId,
        status,
        observacao: cobranca.observacao || "",
        dataCobranca: cobranca.dataCobranca || dataISO(),
        dataLembrete: status === "COBRAR_NOVAMENTE_15_DIAS" ? dataISO(15) : cobranca.dataLembrete
      })
    });

    if (!response.ok) {
      alert("Nao foi possivel atualizar a cobranca.");
      return;
    }

    listarCobrancas();
  }

  async function comentarCobranca(cobranca: Cobranca) {
    const comentario = comentariosCobranca[cobranca.id]?.trim();
    if (!comentario) {
      alert("Digite um comentario para salvar.");
      return;
    }

    const observacaoAtualizada = cobranca.observacao
      ? `${cobranca.observacao}\n\n${comentario}`
      : comentario;

    const response = await authFetch(`${apiUrl}/cobrancas/${cobranca.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...usuarioHeaders() },
      body: JSON.stringify({
        alunoId: cobranca.alunoId,
        status: cobranca.status,
        observacao: observacaoAtualizada,
        dataCobranca: cobranca.dataCobranca || dataISO(),
        dataLembrete: cobranca.dataLembrete
      })
    });

    if (!response.ok) {
      alert("Nao foi possivel adicionar o comentario.");
      return;
    }

    setComentariosCobranca({ ...comentariosCobranca, [cobranca.id]: "" });
    listarCobrancas();
  }

  async function excluirCobranca(cobrancaId: number) {
    if (!window.confirm("Deseja realmente excluir esta cobranca?")) return;

    const response = await authFetch(`${apiUrl}/cobrancas/${cobrancaId}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Nao foi possivel excluir a cobranca.");
      return;
    }

    if (cobrancaEditando?.id === cobrancaId) resetCobrancaForm();
    listarCobrancas();
  }

  async function carregarManutencao() {
    const response = await authFetch(`${apiUrl}/manutencao/status`);
    if (!response.ok) return;
    setManutencaoStatus(await response.json());
  }

  async function baixarBackup() {
    const response = await authFetch(`${apiUrl}/manutencao/backup`);
    if (!response.ok) {
      alert("Nao foi possivel gerar o backup.");
      return;
    }
    const backup = await response.json();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tr-backup-${dataISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function restaurarBackup(file?: File) {
    if (!file) return;
    if (!window.confirm("Restaurar backup substitui alunos, escolas, pagamentos, cobrancas e comissoes atuais. Deseja continuar?")) return;

    const texto = await file.text();
    const response = await authFetch(`${apiUrl}/manutencao/restaurar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...usuarioHeaders() },
      body: texto
    });
    if (!response.ok) {
      alert("Nao foi possivel restaurar o backup.");
      return;
    }

    alert("Backup restaurado!");
    listarTodos();
    listarEscolas();
    listarCobrancas();
    carregarManutencao();
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

    const response = await authFetch(`${apiUrl}/comissao-formatura/escola/${escolaId}`);
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

    const response = await authFetch(`${apiUrl}/comissao-formatura/aluno/${aluno.id}`);
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
    setAlunoFinanceiro(aluno);
    setPagamentosFinanceiro([]);

    const response = await authFetch(`${apiUrl}/pagamentos/aluno/${aluno.id}`);
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

    const response = await authFetch(`${apiUrl}/comissao-formatura`, {
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

    const response = await authFetch(`${apiUrl}/alunos/${alunoId}`, { method: "DELETE" });
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

    const response = await authFetch(`${apiUrl}/escolas/${escolaId}`, { method: "DELETE" });
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
    const response = await authFetch(`${apiUrl}/pagamentos/aluno/${alunoId}`);
    setPagamentos(await response.json());
  }

  async function abrirUltimoReciboAluno(aluno: Aluno) {
    const response = await authFetch(`${apiUrl}/pagamentos/aluno/${aluno.id}`);
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
    const response = await authFetch(`${apiUrl}/pagamentos`, {
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
      const alunoResponse = await authFetch(`${apiUrl}/alunos?nome=${encodeURIComponent(alunoSelecionado.nome)}`);
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
    const whatsappResumo = linkWhatsApp(
      alunoResumo.telefone,
      `Olá, ${alunoResumo.nomeResponsavel || ""}. Segue o resumo financeiro do contrato do(a) aluno(a) ${alunoResumo.nome}. Valor total: ${moeda(alunoResumo.valorContrato)}. Valor restante: ${moeda(alunoResumo.valorRestanteContrato ?? alunoResumo.valorContrato)}.`
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
      <div><div class="label">Senhas do contrato</div><div class="value">${escolaResumo?.quantidadeConvitesContrato ?? 0}</div></div>
    </div>
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

  function controleCobrancas() {
    return (
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">{cobrancaEditando ? "Editar cobranca" : "Nova cobranca"}</h2>
              <p className="mt-2 text-slate-600">Registre o contato, o retorno recebido e a data para cobrar novamente.</p>
            </div>
            <button type="button" onClick={() => { resetCobrancaForm(); setView("menu"); }} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
          </div>

          <div className="mt-6 grid gap-4">
            <select value={cobrancaForm.alunoId} onChange={(e) => setCobrancaForm({ ...cobrancaForm, alunoId: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
              <option value="">Selecione o aluno cobrado</option>
              {alunosFiltradosOrdenados.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>{aluno.nome} {aluno.escola ? `- ${aluno.escola}` : ""}</option>
              ))}
            </select>

            <select value={cobrancaForm.status} onChange={(e) => {
              const status = e.target.value as CobrancaStatus;
              setCobrancaForm({
                ...cobrancaForm,
                status,
                dataLembrete: status === "RESOLVIDO" ? "" : status === "COBRAR_NOVAMENTE_15_DIAS" ? dataISO(15) : cobrancaForm.dataLembrete
              });
            }} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
              {cobrancaStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Data da cobranca
                <input type="date" value={cobrancaForm.dataCobranca} onChange={(e) => setCobrancaForm({ ...cobrancaForm, dataCobranca: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Lembrar novamente
                <input type="date" value={cobrancaForm.dataLembrete} disabled={cobrancaForm.status === "RESOLVIDO"} onChange={(e) => setCobrancaForm({ ...cobrancaForm, dataLembrete: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-slate-100" />
              </label>
            </div>

            <textarea rows={6} placeholder="Observacao sobre o retorno da cobranca" value={cobrancaForm.observacao} onChange={(e) => setCobrancaForm({ ...cobrancaForm, observacao: e.target.value })} className="resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={salvarCobranca} className="rounded-3xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">{cobrancaEditando ? "Atualizar cobranca" : "Salvar cobranca"}</button>
              {cobrancaEditando && (
                <button type="button" onClick={resetCobrancaForm} className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar edicao</button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Demandas recentes</h2>
              <p className="mt-1 text-sm text-slate-500">{cobrancasFiltradas.length} registros encontrados.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={cobrancaFiltroStatus} onChange={(e) => setCobrancaFiltroStatus(e.target.value)} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
                <option value="">Todos os status</option>
                {cobrancaStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button type="button" onClick={listarCobrancas} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Atualizar</button>
            </div>
          </div>

          <div className="space-y-4 p-6">
            {cobrancasFiltradas.length > 0 ? (
              cobrancasFiltradas.map((cobranca) => (
                <article key={cobranca.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">Cobranca</h3>
                      <p className="mt-3 text-sky-800">{cobranca.nomeAluno || "Aluno"} - Financeiro</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {cobranca.nomeResponsavel || "-"} {cobranca.telefoneResponsavel ? `- ${cobranca.telefoneResponsavel}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Cobrado em {formatarData(cobranca.dataCobranca)} {cobranca.dataLembrete ? `- lembrar em ${formatarData(cobranca.dataLembrete)}` : ""}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Criado por {cobranca.criadoPor || "Sistema"} {cobranca.criadoEm ? `em ${new Date(cobranca.criadoEm).toLocaleString("pt-BR")}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ultima alteracao por {cobranca.atualizadoPor || "Sistema"} {cobranca.atualizadoEm ? `em ${new Date(cobranca.atualizadoEm).toLocaleString("pt-BR")}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800">alta</span>
                      <select value={cobranca.status} onChange={(e) => atualizarStatusCobranca(cobranca, e.target.value as CobrancaStatus)} className="min-w-48 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
                        {cobrancaStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => editarCobranca(cobranca)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Editar</button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-800">Comentarios</p>
                    <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-white px-5 py-4 text-sm leading-6 text-sky-950">
                      {cobranca.observacao || "Sem comentarios ainda."}
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                      <textarea rows={4} placeholder="Adicionar comentario" value={comentariosCobranca[cobranca.id] || ""} onChange={(e) => setComentariosCobranca({ ...comentariosCobranca, [cobranca.id]: e.target.value })} className="resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
                      <button type="button" onClick={() => comentarCobranca(cobranca)} className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800">Comentar</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => atualizarStatusCobranca(cobranca, "COBRAR_NOVAMENTE_15_DIAS")} className="rounded-2xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700">Cobrar em 15 dias</button>
                      <button type="button" onClick={() => atualizarStatusCobranca(cobranca, "RESOLVIDO")} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">Marcar resolvido</button>
                      <button type="button" onClick={() => excluirCobranca(cobranca.id)} className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">Excluir</button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Nenhuma cobranca registrada.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function manutencaoSistema() {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Operacao tecnica</p>
              <h2 className="mt-3 text-4xl font-semibold text-slate-950">Manutencao</h2>
            </div>
            <button type="button" onClick={() => setView("menu")} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">Backup manual</h3>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            O backup e salvo no seu computador em JSON. Baixe antes de mudancas grandes e importe o arquivo se precisar recuperar os dados.
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={baixarBackup} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Baixar backup JSON</button>
            <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Importar backup JSON
              <input type="file" accept="application/json" onChange={(e) => restaurarBackup(e.target.files?.[0])} className="hidden" />
            </label>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-slate-950">Manutencao do banco</h3>
            <button type="button" onClick={carregarManutencao} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Atualizar</button>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Use para acompanhar o tamanho das tabelas no Supabase e evitar sistema cheio.
          </div>

          {manutencaoStatus && (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status de lotacao</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-700">{manutencaoStatus.statusLotacao}</p>
                  <p className="mt-1 text-xs text-slate-500">{manutencaoStatus.lembrete}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Uso estimado</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{manutencaoStatus.usoEstimado}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Registros</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{manutencaoStatus.registros}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ano selecionado</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{manutencaoStatus.anoSelecionado}</p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-medium">Tabela</th>
                      <th className="px-5 py-4 font-medium">Linhas</th>
                      <th className="px-5 py-4 font-medium">Tamanho total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manutencaoStatus.tabelas.map((tabela) => (
                      <tr key={tabela.tabela} className="border-t border-slate-200">
                        <td className="px-5 py-4">{tabela.tabela}</td>
                        <td className="px-5 py-4">{tabela.linhas}</td>
                        <td className="px-5 py-4">{tabela.tamanhoTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  function controleUsuarios() {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Acesso interno</p>
              <h2 className="mt-3 text-4xl font-semibold text-slate-950">Usuarios</h2>
              <p className="mt-2 text-sm text-slate-600">Cadastre quem pode entrar no sistema pela tela inicial.</p>
            </div>
            <button type="button" onClick={() => setView("menu")} className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Voltar</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">Novo usuario</h3>
            <div className="mt-5 grid gap-4">
              <input type="text" placeholder="Nome" value={novoUsuarioForm.nome} onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, nome: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="text" placeholder="Login" value={novoUsuarioForm.login} onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, login: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="password" placeholder="Senha provisoria" value={novoUsuarioForm.senha} onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, senha: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <select value={novoUsuarioForm.perfil} onChange={(e) => setNovoUsuarioForm({ ...novoUsuarioForm, perfil: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                <option value="OPERADOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <button type="button" onClick={criarUsuario} className="rounded-3xl bg-sky-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-700">Cadastrar usuario</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-slate-950">Usuarios cadastrados</h3>
              <button type="button" onClick={listarUsuarios} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Atualizar</button>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-medium">Nome</th>
                    <th className="px-5 py-4 font-medium">Login</th>
                    <th className="px-5 py-4 font-medium">Perfil</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-slate-200">
                      <td className="px-5 py-4 font-semibold text-slate-950">{usuario.nome}</td>
                      <td className="px-5 py-4">{usuario.login}</td>
                      <td className="px-5 py-4">{usuario.perfil || "OPERADOR"}</td>
                      <td className="px-5 py-4">{usuario.ativo === false ? "Inativo" : "Ativo"}</td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td className="px-5 py-6 text-slate-500" colSpan={4}>Nenhum usuario carregado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    );
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

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
            <button type="button" onClick={() => { setView("cobrancas"); listarTodos(); listarCobrancas(); }} className="w-full rounded-3xl bg-violet-600 p-6 text-left text-white transition hover:bg-violet-700">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-100">Financeiro</span>
              <span className="mt-3 block text-2xl font-semibold">Cobrancas</span>
            </button>
            <p className="mt-4 rounded-3xl border border-violet-200 bg-white px-5 py-4 text-sm font-semibold text-violet-700">{indicadores.cobrancasPendentes} cobrancas pendentes</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <button type="button" onClick={() => { setView("manutencao"); carregarManutencao(); }} className="w-full rounded-3xl bg-slate-950 p-6 text-left text-white transition hover:bg-slate-800">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Sistema</span>
              <span className="mt-3 block text-2xl font-semibold">Manutencao</span>
            </button>
            <p className="mt-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700">Backups, restauracao e tamanho do banco</p>
          </div>

          <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
            <button type="button" onClick={() => { setView("usuarios"); listarUsuarios(); }} className="w-full rounded-3xl bg-cyan-700 p-6 text-left text-white transition hover:bg-cyan-800">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">Acesso</span>
              <span className="mt-3 block text-2xl font-semibold">Usuarios</span>
            </button>
            <p className="mt-4 rounded-3xl border border-cyan-200 bg-white px-5 py-4 text-sm font-semibold text-cyan-800">Cadastro de logins da equipe</p>
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
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
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
              <input type="text" placeholder="Nome" value={alunoForm.nome} onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="text" placeholder="Nome do responsavel" value={alunoForm.nomeResponsavel} onChange={(e) => setAlunoForm({ ...alunoForm, nomeResponsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="tel" placeholder="Telefone do responsavel" value={alunoForm.telefoneResponsavel} onChange={(e) => setAlunoForm({ ...alunoForm, telefoneResponsavel: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <input type="tel" placeholder="Telefone do aluno" value={alunoForm.telefone} onChange={(e) => setAlunoForm({ ...alunoForm, telefone: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
              <select value={alunoForm.escolaId} onChange={(e) => setAlunoForm({ ...alunoForm, escolaId: e.target.value, escola: escolas.find((escola) => escola.id.toString() === e.target.value)?.nomeEscola || "" })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                <option value="">Selecione a escola</option>
                {escolas.map((escola) => (
                  <option key={escola.id} value={escola.id}>{escola.nomeEscola}</option>
                ))}
              </select>
              <input type="text" placeholder="Turma" value={alunoForm.turma} onChange={(e) => setAlunoForm({ ...alunoForm, turma: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
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

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Conta de pagamento</h2>
            {alunoSelecionado ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm uppercase tracking-[0.24em] text-slate-500">Aluno</p><p className="mt-2 text-xl font-semibold text-slate-950">{alunoSelecionado.nome}</p><p className="mt-1 text-sm text-slate-500">{alunoSelecionado.telefone}</p></div>
                <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm uppercase tracking-[0.24em] text-slate-500">Responsavel</p><p className="mt-2 text-xl font-semibold text-slate-950">{alunoSelecionado.nomeResponsavel || "-"}</p><p className="mt-1 text-sm text-slate-500">{alunoSelecionado.telefoneResponsavel || "-"}</p></div>
                <div className="grid gap-4">
                  <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm uppercase tracking-[0.24em] text-slate-500">Valor total do contrato</p><p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorTotalContrato)}</p></div>
                  <div className="rounded-3xl bg-slate-50 p-5"><p className="text-sm uppercase tracking-[0.24em] text-slate-500">Valor para quitar contrato</p><p className="mt-3 text-2xl font-semibold text-slate-950">{moeda(valorRestanteContrato)}</p></div>
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
              <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-slate-600">Selecione um aluno na tabela para visualizar pagamentos.</div>
            )}
          </div>
        </aside>
      </section>
    );
  }

  if (!usuarioLogado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Painel TR</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Entrar no sistema</h1>
          <p className="mt-2 text-slate-600">Use o login e senha cadastrados para acessar o CRM.</p>

          <div className="mt-6 grid gap-4">
            <input type="text" placeholder="Login" value={loginForm.login} onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <input type="password" placeholder="Senha" value={loginForm.senha} onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") entrar(); }} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
            <button type="button" onClick={entrar} className="rounded-3xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800">Entrar</button>
          </div>

          <p className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-500">
            Novos usuarios sao cadastrados dentro do sistema por um usuario ja logado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <main className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Painel TR</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">CRM de Alunos</h1>
              <p className="max-w-2xl text-slate-600">Cadastro de alunos, escolas e controle de pagamentos.</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>Usuario: <strong className="text-slate-950">{usuarioLogado.nome}</strong></span>
                <button type="button" onClick={sair} className="font-semibold text-rose-700">Sair</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Alunos</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{indicadores.totalAlunos}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Escolas</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{indicadores.totalEscolas}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Cobrancas</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{indicadores.cobrancasPendentes}</p>
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
        {view === "cobrancas" && controleCobrancas()}
        {view === "manutencao" && manutencaoSistema()}
      </main>
    </div>
  );
}
