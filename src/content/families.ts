export type Family = {
  id: string;
  nome: string;
  tipo: "conhecida" | "original" | "desconhecida";
  introPublica: string;
  contexto: string;
  costumesPossiveis: string[];
  perguntasContextuais: string[];
  origemDaInformacao: "canon" | "campanha" | "proposta";
};
export const families: Family[] = [
  {
    id: "black",
    nome: "Black",
    tipo: "conhecida",
    introPublica:
      "Linhagem antiga, prestígio e tradições. Alguns ramos têm expectativas rígidas; isso não descreve toda pessoa Black.",
    contexto:
      "Seu ramo pode seguir, questionar ou desconhecer essas tradições.",
    costumesPossiveis: ["Cuidado com reputação", "Tradições familiares"],
    perguntasContextuais: [
      "Seu ramo era exigente?",
      "O que esperavam de você?",
      "Como reagiam à desobediência?",
    ],
    origemDaInformacao: "canon",
  },
  {
    id: "scamander",
    nome: "Scamander",
    tipo: "conhecida",
    introPublica:
      "Nesta campanha, criadores de criaturas com tradição de hipogrifos e uma propriedade com estábulos e áreas de tratamento.",
    contexto:
      "Contexto da campanha em 1890, sem determinar seus talentos ou sua história.",
    costumesPossiveis: ["Cuidado com criaturas", "Trabalho nos estábulos"],
    perguntasContextuais: [
      "Cresceu próximo a criaturas?",
      "Algum animal marcou sua infância?",
      "Queria seguir essa tradição?",
    ],
    origemDaInformacao: "campanha",
  },
  {
    id: "malfoy",
    nome: "Malfoy",
    tipo: "conhecida",
    introPublica:
      "Patrimônio, influência e círculos sociais podem trazer expectativas ligadas à reputação.",
    contexto: "O contexto depende do ramo que você escolher.",
    costumesPossiveis: ["Encontros sociais", "Cuidado com a imagem"],
    perguntasContextuais: [
      "Que imagem se esperava da família?",
      "Seu ramo era rígido?",
    ],
    origemDaInformacao: "canon",
  },
  {
    id: "gaunt",
    nome: "Gaunt",
    tipo: "conhecida",
    introPublica:
      "Linhagem associada a antigas histórias e ao legado de Slytherin.",
    contexto:
      "O contexto individual depende do ramo e da campanha; rumores não são fatos.",
    costumesPossiveis: ["Histórias de ascendência"],
    perguntasContextuais: [
      "Que histórias de família conhece?",
      "Quais são apenas rumores?",
    ],
    origemDaInformacao: "canon",
  },
  {
    id: "potter",
    nome: "Potter",
    tipo: "conhecida",
    introPublica:
      "Nesta campanha, um legado de cadernos, pesquisas e remédios.",
    contexto: "Você decide se esse legado fez parte da sua infância.",
    costumesPossiveis: ["Receitas", "Anotações e estudos"],
    perguntasContextuais: [
      "Havia receitas, estudos ou ofícios comuns na casa?",
    ],
    origemDaInformacao: "campanha",
  },
  {
    id: "weasley",
    nome: "Weasley",
    tipo: "conhecida",
    introPublica:
      "Uma rede de parentes e conexões. Não se presume pobreza em 1890.",
    contexto: "Apoio e cobranças variam entre pessoas e ramos.",
    costumesPossiveis: ["Convívio com parentes"],
    perguntasContextuais: ["Quem era próximo?", "Havia apoio ou cobranças?"],
    origemDaInformacao: "canon",
  },
  {
    id: "ollivander",
    nome: "Ollivander",
    tipo: "conhecida",
    introPublica: "Oficinas, estudo e conhecimento sobre o ofício de varinhas.",
    contexto:
      "O formulário não escolhe sua varinha nem exige que siga esse ofício.",
    costumesPossiveis: ["Trabalho de oficina"],
    perguntasContextuais: [
      "Conhecia o ofício?",
      "Havia expectativa de aprendê-lo?",
    ],
    origemDaInformacao: "canon",
  },
  {
    id: "longbottom",
    nome: "Longbottom",
    tipo: "conhecida",
    introPublica: "Família existente, com pouco detalhe canônico sobre 1890.",
    contexto: "Não se presume afinidade com Herbologia.",
    costumesPossiveis: [],
    perguntasContextuais: ["Que tradição seu ramo tinha?"],
    origemDaInformacao: "canon",
  },
  {
    id: "burke",
    nome: "Burke",
    tipo: "conhecida",
    introPublica:
      "Possíveis ligações comerciais e conhecimento de artefatos antigos, inclusive controversos.",
    contexto:
      "Essas possibilidades não são verdades automáticas sobre seu ramo.",
    costumesPossiveis: ["Comércio", "Estudo de objetos antigos"],
    perguntasContextuais: [
      "O que sua casa comercializava ou estudava?",
      "Qual era a reputação local?",
    ],
    origemDaInformacao: "proposta",
  },
  {
    id: "outra",
    nome: "Outra família original",
    tipo: "original",
    introPublica:
      "Crie um sobrenome e descreva sua cultura familiar, atividade, reputação e relações.",
    contexto: "Uma família comum também pode ter uma história importante.",
    costumesPossiveis: [],
    perguntasContextuais: [
      "Qual tradição?",
      "Qual cobrança?",
      "O que ainda falta definir?",
    ],
    origemDaInformacao: "proposta",
  },
  {
    id: "desconhecida",
    nome: "Origem desconhecida / sem linhagem conhecida",
    tipo: "desconhecida",
    introPublica:
      "Você pode conhecer quem o criou sem conhecer sua ascendência, ou ter um sobrenome sem ligação com uma linhagem.",
    contexto:
      "Sem linhagem conhecida não significa sem família afetiva. Uma família trouxa pode ser perfeitamente conhecida.",
    costumesPossiveis: [],
    perguntasContextuais: [
      "Quem o criou?",
      "Sabe algo sobre seus parentes de nascimento?",
      "Quer explorar isso?",
    ],
    origemDaInformacao: "proposta",
  },
];
