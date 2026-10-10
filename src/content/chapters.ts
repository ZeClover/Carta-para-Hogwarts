export const chapterIds = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;
export type ChapterId = (typeof chapterIds)[number];
export type QuestionType =
  "text" | "long" | "single" | "multi" | "relations" | "objects" | "opening";
export type Question = {
  id: string;
  label: string;
  help: string;
  example?: string;
  type: QuestionType;
  required?: boolean;
  recommended?: boolean;
  choices?: readonly string[];
  explain?: boolean;
  conditionalExplanation?: boolean;
  tags: string[];
};
function q(
  id: string,
  label: string,
  help: string,
  type: QuestionType = "long",
  choices?: readonly string[],
  options: Partial<Question> = {},
): Question {
  return {
    id,
    label,
    help,
    type,
    choices,
    tags: [id.replace(/\d+$/, "")],
    recommended: true,
    ...options,
  };
}
export const chapters: Record<
  ChapterId,
  {
    title: string;
    intro: string;
    transition: string;
    scene: string;
    symbol: string;
    questions: Question[];
    extensions: { id: string; title: string }[];
  }
> = {
  I: {
    title: "Registro de Admissão",
    intro: "Toda grande história começa com alguém, e esta começa com você.",
    transition: "Seu nome é o início.",
    scene: "letter",
    symbol: "✒",
    questions: [],
    extensions: [],
  },
  II: {
    title: "Antes da Carta",
    intro:
      "Antes das torres de Hogwarts, havia uma criança, uma casa, vozes familiares e lembranças que o tempo ainda não apagou.",
    transition:
      "Antes de receber esta carta, você já tinha uma história. Voltemos ao começo.",
    scene: "album",
    symbol: "▧",
    questions: [
      q(
        "II01",
        "Com quem você cresceu?",
        "Pais, responsáveis, parentes, tutores, família adotiva ou outros. Você pode cadastrar várias pessoas e descrever convivência, residências e quem esteve mais presente.",
        "relations",
      ),
      q(
        "II02",
        "Como era o lugar onde passou sua infância?",
        "Pense em sons, cômodos, paisagem e clima afetivo. Não é necessário informar endereço.",
        "long",
        undefined,
        { example: "Uma casa perto do mar, com cheiro de pão pela manhã." },
      ),
      q(
        "II03",
        "Como era um dia comum?",
        "Tarefas, brincadeiras, estudos, animais e lugares favoritos. Uma rotina tranquila também é uma história.",
      ),
      q(
        "II04",
        "Pessoa mais importante da infância",
        "Selecione alguém já cadastrado ou adicione uma pessoa. Conte por que era importante.",
        "relations",
        undefined,
        { explain: true },
      ),
      q(
        "II05",
        "Uma lembrança feliz",
        "Descreva uma pequena alegria e o que a torna importante.",
        "long",
        undefined,
        {
          example: "Aprender a assobiar com um tio durante uma tarde de chuva.",
        },
      ),
      q(
        "II06",
        "Uma lembrança difícil",
        "Pode ser uma decepção simples. Você pode pular sem justificar; não é preciso criar tragédia.",
        "long",
        undefined,
        { recommended: false },
      ),
      q(
        "II07",
        "Como você agia quando criança?",
        "São exemplos, não rótulos definitivos. Selecione e conte mais, se quiser.",
        "multi",
        [
          "Curioso",
          "Reservado",
          "Obediente",
          "Contestador",
          "Falante",
          "Cuidadoso",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "II08",
        "Objeto ou lugar querido",
        "Um significado afetivo não implica propriedade mágica. Reutilize objetos já registrados.",
        "objects",
        undefined,
        { recommended: false },
      ),
      q(
        "II09",
        "O que sonhava fazer quando crescesse?",
        "Esse sonho infantil pode ser diferente da sua ambição de hoje.",
      ),
    ],
    extensions: [
      { id: "II-A", title: "Alguma tradição familiar que nunca compreendeu?" },
      { id: "II-B", title: "Há alguém da família sobre quem sabe pouco?" },
      {
        id: "II-C",
        title: "Existe uma lembrança incompleta que gostaria de explorar?",
      },
    ],
  },
  III: {
    title: "O Despertar da Magia",
    intro:
      "Às vezes, a magia começa com uma janela que se abre sozinha, um objeto que se move ou um acontecimento impossível de esquecer.",
    transition:
      "Algumas crianças crescem sabendo que a magia existe. Outras passam anos sem sequer imaginar. Mas, cedo ou tarde, algo impossível acontece.",
    scene: "magic",
    symbol: "✧",
    questions: [
      q(
        "III01",
        "Cresceu sabendo que o mundo mágico existia?",
        "Isso é diferente de status de sangue. Não define sua ascendência.",
        "single",
        ["sim", "nao", "parcialmente", "incerto"],
        { required: true },
      ),
      q(
        "III02",
        "Primeira lembrança relacionada à magia",
        "Pode ser magia de outra pessoa, especialmente se você cresceu entre bruxos.",
      ),
      q(
        "III03",
        "Alguma manifestação mágica causada por você?",
        "Um acontecimento infantil não concede poder mecânico. Se não lembra, escolha “Não sei”.",
      ),
      q(
        "III04",
        "Como as pessoas reagiram?",
        "Pessoas diferentes podem ter reagido de maneiras diferentes. Identifique quem fez o quê.",
        "multi",
        [
          "Alegria",
          "Surpresa",
          "Medo",
          "Orgulho",
          "Preocupação",
          "Naturalidade",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "III05",
        "O que sentiu ao descobrir que podia fazer magia?",
        "Você pode sentir várias coisas ao mesmo tempo.",
        "multi",
        [
          "Alegria",
          "Medo",
          "Curiosidade",
          "Alívio",
          "Confusão",
          "Orgulho",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "III06",
        "Conhecia jovens bruxos antes de Hogwarts?",
        "Reutilize pessoas já cadastradas. É válido não conhecer ninguém.",
        "relations",
        undefined,
        { recommended: false },
      ),
      q(
        "III07",
        "Que ideia fazia de Hogwarts?",
        "Descreva boatos, histórias ou expectativas. O que ouviu não se torna fato automaticamente.",
      ),
    ],
    extensions: [
      { id: "III-A", title: "Uma manifestação que não conseguiu explicar" },
      { id: "III-B", title: "Uma reação incomum de alguém" },
    ],
  },
  IV: {
    title: "O Chamado de Hogwarts",
    intro:
      "Um envelope, um selo e seu nome cuidadosamente escrito. A notícia de que sua vida estava prestes a mudar.",
    transition: "Três batidas na janela. Uma notícia, muitas possibilidades.",
    scene: "owl",
    symbol: "✉",
    questions: [
      q(
        "IV01",
        "Como recebeu a notícia?",
        "A forma de receber a notícia depende da sua história. Selecione uma possibilidade e descreva os detalhes.",
        "single",
        [
          "Coruja",
          "Familiar",
          "Representante da escola",
          "A família aguardava",
          "Outra forma",
        ],
        { explain: true },
      ),
      q(
        "IV02",
        "Quem estava ao seu lado?",
        "Selecione uma pessoa conhecida ou cadastre alguém. É válido ter recebido a notícia sozinho.",
        "relations",
      ),
      q(
        "IV03",
        "Primeira reação",
        "Não existe uma reação certa.",
        "multi",
        [
          "Alegria",
          "Surpresa",
          "Orgulho",
          "Receio",
          "Curiosidade",
          "Dúvida",
          "Indiferença",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "IV04",
        "Reação dos responsáveis ou da família",
        "Sua escolha de família pode oferecer contexto, mas não determina a reação.",
      ),
      q(
        "IV05",
        "Alguém não gostou da ideia da partida?",
        "“Ninguém se opôs” é uma resposta válida.",
        "single",
        ["Ninguém se opôs", "Alguém se opôs", "Não sei"],
        { explain: true, recommended: false },
      ),
      q(
        "IV06",
        "O que espera encontrar em Hogwarts?",
        "Você ainda não viveu a chegada à escola. Conte suas expectativas.",
        "multi",
        [
          "Aulas",
          "Amizades",
          "Aventuras",
          "Autonomia",
          "Aprendizado",
          "O castelo",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "IV07",
        "O que o preocupa nessa mudança?",
        "“Nada em especial” também é válido.",
        "long",
        undefined,
        { recommended: false },
      ),
      q(
        "IV08",
        "Do que sentirá mais falta?",
        "Pessoas, lugares ou hábitos. Você também pode querer recomeçar.",
      ),
      q(
        "IV09",
        "Levará algum objeto significativo?",
        "Reutilize um objeto querido da infância. O significado é afetivo; não concede efeitos mágicos.",
        "objects",
        undefined,
        { recommended: false },
      ),
    ],
    extensions: [
      {
        id: "IV-A",
        title: "Uma reação surpreendente cuja motivação ficou em aberto",
      },
    ],
  },
  V: {
    title: "Quem Você Realmente É",
    intro:
      "Seu passado ajuda a explicar quem você se tornou. Mas nem mesmo ele pode decidir todas as suas escolhas.",
    transition:
      "Seu nome conta de onde você veio. Suas lembranças contam o que viveu. Mas nenhuma dessas coisas explica completamente quem você é.",
    scene: "mirror",
    symbol: "◇",
    questions: [
      q(
        "V01",
        "Como descreveria sua personalidade?",
        "Escolha exemplos e acrescente nuances. Não há pontuação ou seleção de Casa.",
        "multi",
        [
          "Curioso",
          "Reservado",
          "Generoso",
          "Impulsivo",
          "Determinado",
          "Cauteloso",
          "Bem-humorado",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "V02",
        "Do que mais gosta em si?",
        "Pode ser uma pequena qualidade, um hábito ou uma forma de tratar as pessoas.",
      ),
      q(
        "V03",
        "O que gostaria de mudar?",
        "Não é preciso depreciar seu personagem. Ele pode estar satisfeito consigo.",
      ),
      q(
        "V04",
        "Como age ao conhecer alguém?",
        "Pense em uma primeira conversa e no tempo que leva para se aproximar.",
      ),
      q(
        "V05",
        "Como reage a uma provocação ou desrespeito?",
        "As circunstâncias podem mudar sua reação.",
        "single",
        [
          "Converso",
          "Me afasto",
          "Reajo imediatamente",
          "Procuro ajuda",
          "Depende",
          "Outra reação",
        ],
        { explain: true },
      ),
      q(
        "V06",
        "O que conquista sua confiança?",
        "Gestos, sinceridade, tempo, lealdade ou algo diferente.",
      ),
      q(
        "V07",
        "Amigo violou regra importante; o que faz?",
        "Não há resposta moral correta. Você pode explicar o contexto.",
        "single",
        [
          "Protejo",
          "Converso",
          "Informo um responsável",
          "Não me envolvo",
          "Outro",
        ],
        { explain: true },
      ),
      q(
        "V08",
        "Encontrou objeto valioso de outra pessoa; o que faz?",
        "Conte sua escolha, sem pontuação de comportamento.",
        "single",
        [
          "Procuro o dono",
          "Entrego a um responsável",
          "Guardo até descobrir de quem é",
          "Outra escolha",
        ],
        { explain: true },
      ),
      q(
        "V09",
        "Há algo em que acredita profundamente?",
        "Uma convicção pode mudar ao longo da campanha.",
      ),
    ],
    extensions: [
      { id: "V-A", title: "O que os outros entendem errado sobre você?" },
      { id: "V-B", title: "Algo que diz não importar, mas importa?" },
    ],
  },
  VI: {
    title: "Aquilo que o Coração Guarda",
    intro:
      "Toda pessoa carrega algo que deseja alcançar e algo que teme perder.",
    transition: "O espelho dá lugar ao céu. Há sonhos que ainda não têm nome.",
    scene: "stars",
    symbol: "✶",
    questions: [
      q(
        "VI01",
        "Maior sonho ou ambição",
        "O que gostaria de alcançar? Não precisa ser extraordinário.",
      ),
      q(
        "VI02",
        "Por que esse sonho importa?",
        "Relacione ao sonho que escreveu acima.",
      ),
      q(
        "VI03",
        "Quem deseja impressionar ou deixar orgulhoso?",
        "Selecione alguém e explique. “Ninguém” também é válido.",
        "relations",
        undefined,
        { explain: true, recommended: false },
      ),
      q(
        "VI04",
        "Maior medo",
        "Pode ser concreto, emocional ou ambos. Você pode preferir não responder.",
        "single",
        ["Concreto", "Emocional", "Ambos"],
        { explain: true },
      ),
      q(
        "VI05",
        "O que teme perder?",
        "Não é necessário que uma perda já tenha ocorrido.",
        "long",
        undefined,
        { recommended: false },
      ),
      q(
        "VI06",
        "Como age quando sente medo?",
        "Uma situação pode ter mais de uma resposta.",
        "single",
        [
          "Procuro apoio",
          "Enfrento",
          "Me afasto",
          "Fico em silêncio",
          "Depende",
          "Outra reação",
        ],
        { explain: true },
      ),
      q(
        "VI07",
        "Até onde iria pelo sonho?",
        "Sua escolha não fixa para sempre seu desenvolvimento moral.",
        "single",
        [
          "Arriscaria quase tudo",
          "Depende do sacrifício",
          "Não ultrapassaria certos limites",
          "Ainda não sei",
        ],
        { explain: true },
      ),
      q(
        "VI08",
        "O que jamais faria mesmo para conseguir o que deseja?",
        "Você pode definir limites pessoais do personagem.",
        "long",
        undefined,
        { recommended: false },
      ),
      q(
        "VI09",
        "Se pudesse mudar algo do passado, o que seria?",
        "“Nada” é uma resposta válida.",
        "long",
        undefined,
        { recommended: false },
      ),
    ],
    extensions: [
      {
        id: "VI-A",
        title: "Algo que teme descobrir? O medo não prova que aconteceu.",
      },
      {
        id: "VI-B",
        title: "O que poderia fazê-lo duvidar das próprias crenças?",
      },
    ],
  },
  VII: {
    title: "Laços, Segredos e Pontas Soltas",
    intro:
      "Nenhuma história é escrita por uma única pessoa. Algumas relações são claras. Outras ainda têm páginas por escrever.",
    transition:
      "Um baú de cartas, retratos e páginas em branco. Quem faz parte da sua história?",
    scene: "chest",
    symbol: "❧",
    questions: [
      q(
        "VII01",
        "Pessoas importantes hoje",
        "Nome, papel, proximidade e história. Separe o que sabe do que acredita; não presuma morte ou mistério.",
        "relations",
      ),
      q(
        "VII02",
        "Sente saudade de alguém?",
        "Não presuma morte. Selecione uma pessoa e conte mais.",
        "relations",
        undefined,
        { explain: true, recommended: false },
      ),
      q(
        "VII03",
        "Relação difícil",
        "Não é preciso criar um inimigo. Reutilize uma pessoa e explique a dificuldade.",
        "relations",
        undefined,
        { explain: true, recommended: false },
      ),
      q(
        "VII04",
        "Promessa feita a alguém",
        "Selecione a pessoa e escreva a promessa.",
        "relations",
        undefined,
        { explain: true, recommended: false },
      ),
      q(
        "VII05",
        "Guarda algum segredo?",
        "Se sim ou talvez, conte quem sabe e o que é fato. A exploração só será autorizada em um gancho separado.",
        "single",
        ["sim", "talvez", "nao"],
        { explain: true, conditionalExplanation: true, recommended: false },
      ),
      q(
        "VII06",
        "Algo que nunca conseguiu dizer?",
        "Pode ser algo simples, ou você pode pular.",
        "long",
        undefined,
        { recommended: false },
      ),
      q(
        "VII07",
        "Algum arrependimento?",
        "“Nenhum” também é válido.",
        "long",
        undefined,
        { recommended: false },
      ),
      q(
        "VII08",
        "Acontecimento passado que não compreende?",
        "Descreva apenas o que presenciou ou soube; deixe a explicação em aberto se desejar.",
        "opening",
        undefined,
        { recommended: false },
      ),
      q(
        "VII09",
        "Pergunta sobre sua vida cuja resposta quer encontrar?",
        "Pode ser algo cotidiano, sem revelação extraordinária.",
        "opening",
        undefined,
        { recommended: false },
      ),
      q(
        "VII10",
        "O que gostaria de deixar nas mãos do Mestre?",
        "As escolhas abaixo são interesses. Só um gancho com permissão explícita autoriza exploração. “Nada” é válido.",
        "multi",
        [
          "Passado",
          "Família",
          "Pessoa desconhecida",
          "Significado de objeto",
          "Outro",
          "Nada",
        ],
        { explain: true, recommended: false },
      ),
    ],
    extensions: [],
  },
};
export const allNarrativeQuestions = chapterIds.flatMap(
  (id) => chapters[id].questions,
);
export const themeOptions = [
  "familia",
  "misterio",
  "amizade",
  "rivalidade",
  "romance",
  "criaturas",
  "exploracao",
  "investigacao",
  "drama_escolar",
  "heranca",
  "magia",
  "aventura",
  "outro",
] as const;
export const labels: Record<string, string> = {
  sim: "Sim",
  nao: "Não",
  talvez: "Talvez",
  parcialmente: "Parcialmente",
  incerto: "Incerto",
  closed: "Fechado — não criar revelação",
  details: "Detalhes secundários",
  explanation: "Explicação ou causa em aberto",
  broad: "Surpresa maior neste fio",
  yes: "Sim",
  maybe: "Talvez, conversar antes",
  no: "Não",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  answered: "Responder",
  skipped: "Pular",
  unknown: "Não sei",
  prefer_not_to_answer: "Prefiro não responder",
  not_applicable: "Não se aplica",
};
