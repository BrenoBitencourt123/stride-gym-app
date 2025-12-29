export type HelpEntry = {
  title: string;
  body: string;
  example?: string;
  tips?: string[];
  learnMoreUrl?: string;
};

export const HELP: Record<string, HelpEntry> = {
  // ========== HOME ==========
  "home.plan": {
    title: "Metas atuais",
    body: "Suas metas de calorias e macros calculadas com base no seu objetivo, peso e nível de atividade.",
    example: "Se você quer perder peso, o app calcula um déficit calórico seguro.",
    tips: [
      "Você pode ajustar suas metas em Configurações.",
      "Consistência importa mais do que perfeição diária.",
    ],
  },
  "home.progress": {
    title: "Progresso e ajustes",
    body: "Acompanhe sua evolução de peso e receba sugestões automáticas de ajuste de calorias.",
    tips: [
      "Ajustes são conservadores (máximo ±150 kcal por semana).",
      "O app nunca reduz abaixo de um mínimo seguro.",
    ],
  },
  "home.streak": {
    title: "Consistência",
    body: "Quantos dias seguidos você completou suas metas de treino e/ou nutrição.",
    example: "Manter um streak te ajuda a criar hábitos duradouros.",
  },
  "home.goals": {
    title: "Missões diárias",
    body: "Pequenas tarefas que rendem XP e te ajudam a manter o foco.",
    tips: [
      "Complete as 3 missões do dia para maximizar seu XP.",
    ],
  },

  // ========== TREINO ==========
  "treino.timer": {
    title: "Tempo do treino",
    body: "Mostra há quanto tempo você está treinando nesta sessão.",
    example: "Use como referência, mas priorize técnica e descanso adequado.",
  },
  "treino.volume": {
    title: "Volume total (kg)",
    body: "Soma aproximada do 'trabalho' do treino (carga × reps × séries).",
    tips: [
      "Compare semana a semana; subir muito rápido pode aumentar fadiga.",
    ],
  },
  "treino.completedSets": {
    title: "Séries concluídas",
    body: "Quantas séries você já marcou como feitas / total planejado.",
  },
  "treino.rest": {
    title: "Descanso",
    body: "Tempo entre séries para recuperar força e manter desempenho.",
    example: "Compostos: 2–3 min | Isoladores: 60–90s (ajuste conforme necessário).",
  },
  "treino.repsTarget": {
    title: "Repetições alvo",
    body: "Faixa de repetições sugerida para este exercício. Complete dentro do range mantendo boa técnica.",
    example: "Se o range é 8-12, busque fazer pelo menos 8 com controle.",
  },
  "treino.rir": {
    title: "RIR (Reps In Reserve)",
    body: "Quantas repetições 'sobrariam' com boa técnica antes de falhar.",
    example: "RIR 2 = você conseguiria fazer +2 reps com técnica.",
    tips: [
      "RIR ajuda a calibrar intensidade sem ir até a falha total.",
      "Treinar com RIR 1-3 é geralmente ideal para ganho muscular.",
    ],
  },
  "treino.doubleProgression": {
    title: "Progressão (double progression)",
    body: "Primeiro você sobe reps dentro do range. Quando bater o topo com o RIR certo, sobe a carga.",
    example: "Range 6–10: chegou em 10 reps com RIR 2 → aumenta o peso na próxima.",
    tips: [
      "Anote suas séries para saber quando progredir.",
    ],
  },
  "treino.deload": {
    title: "Deload",
    body: "Semana mais leve para recuperar e voltar a progredir (menos séries e/ou menos carga).",
    tips: [
      "Deload não é 'regredir' — é preparar o próximo avanço.",
      "Considere um deload a cada 4-6 semanas ou quando sentir fadiga acumulada.",
    ],
  },

  // ========== NUTRIÇÃO ==========
  "nutri.calories": {
    title: "Calorias (kcal)",
    body: "Energia total que você consome. O balanço entre consumo e gasto determina se você ganha, mantém ou perde peso.",
    tips: [
      "Pequenas variações diárias são normais. Foque na média semanal.",
    ],
  },
  "nutri.macros": {
    title: "Macros",
    body: "Proteína, carbo e gordura. O app usa isso para bater metas com consistência.",
    tips: [
      "Se não der para bater perfeito todo dia, busque a média da semana.",
      "Proteína é geralmente a prioridade para quem treina.",
    ],
  },
  "nutri.checkin": {
    title: "Check-in e ajustes",
    body: "Revisão semanal do seu progresso. O app sugere pequenos ajustes de calorias baseado na sua tendência de peso.",
    example: "Se você quer perder peso mas ele estagnou, o app pode sugerir -100 kcal.",
    tips: [
      "Ajustes são sempre conservadores e seguros.",
      "Você pode aceitar ou ignorar a sugestão.",
    ],
  },
  "nutri.goals": {
    title: "Metas nutricionais",
    body: "Suas metas diárias de calorias e macronutrientes calculadas no onboarding.",
    tips: [
      "Você pode ajustar suas metas em 'Ajustar objetivo'.",
    ],
  },

  // ========== ONBOARDING ==========
  "onboard.bmr": {
    title: "TMB (BMR)",
    body: "Estimativa de calorias que seu corpo gasta em repouso. É a energia mínima para funções vitais.",
    example: "Respirar, manter temperatura corporal, funções celulares básicas.",
  },
  "onboard.tdee": {
    title: "TDEE",
    body: "Estimativa de gasto diário total (TMB + atividade). É a base para definir sua meta de calorias.",
    tips: [
      "Se você quer perder peso, comemos um pouco menos que o TDEE.",
      "Se quer ganhar, comemos um pouco mais.",
    ],
  },
  "onboard.activity": {
    title: "Nível de atividade",
    body: "Considera seu dia a dia (trabalho, deslocamento) e exercícios. Quanto mais ativo, maior seu TDEE.",
    example: "Sedentário: trabalho de escritório sem exercícios. Ativo: trabalho físico + academia.",
  },
};
