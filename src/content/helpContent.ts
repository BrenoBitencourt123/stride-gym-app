export type HelpEntry = {
  title: string;
  body: string;
  tips?: string[];
  example?: string;
};

export const HELP: Record<string, HelpEntry> = {
  // ========== HOME ==========
  "home.plan": {
    title: "Suas metas do dia",
    body: "Aqui estão as metas que o app usa como base para guiar sua dieta. Elas podem mudar com o tempo (check-in) para manter o progresso no rumo certo.",
    tips: [
      "Se você errar um dia, tudo bem: o que importa é a média da semana.",
      "Bata proteína primeiro. Depois ajuste carbo/gordura conforme preferência.",
    ],
    example: "Exemplo: meta 2200 kcal. Se hoje você fizer 2000, amanhã não precisa 'pagar'. Só volte ao normal e acompanhe a média semanal.",
  },
  "home.progress": {
    title: "Progresso e ajustes",
    body: "Isso mostra se você está andando na direção do objetivo. O app usa seu histórico para sugerir pequenos ajustes de calorias quando necessário.",
    tips: [
      "Ajustes são pequenos de propósito (evita extremos).",
      "Mudanças no peso variam com água/sódio. Olhe tendência, não um dia isolado.",
    ],
    example: "Se seu objetivo é perder gordura e o peso não mexe por 2 semanas, o app pode sugerir -100 kcal/dia.",
  },
  "home.goals": {
    title: "Missões diárias",
    body: "Tarefas simples que ajudam a criar consistência. Complete-as para acumular XP e manter o foco.",
    tips: [
      "Não precisa completar todas todo dia. O importante é a regularidade.",
      "Se errou um dia, volte no próximo. Não tente 'compensar'.",
    ],
    example: "3 missões/dia = você está no caminho certo. Se fizer 2, tudo bem — amanhã é outro dia.",
  },

  // ========== TREINO ==========
  "treino.timer": {
    title: "Tempo do treino",
    body: "Serve para você ter noção de ritmo. Um treino bom não é o mais longo — é o mais bem executado e consistente.",
    tips: [
      "Se o tempo sobe muito, provavelmente o descanso está longo demais ou tem séries demais.",
      "Se o tempo cai muito, talvez o descanso esteja curto e você perde performance.",
    ],
    example: "Um Upper pode levar 45–70 min. Se estiver dando 90+ min sempre, revise descanso e número de séries.",
  },
  "treino.volume": {
    title: "Volume total (kg)",
    body: "É uma estimativa do quanto de trabalho você fez (carga × reps × séries). Use para comparar semanas iguais, não treinos diferentes.",
    tips: [
      "Subir um pouco ao longo das semanas é bom.",
      "Subir rápido demais pode aumentar fadiga e atrapalhar progressão.",
    ],
    example: "Semana 1: 12.000 kg → Semana 2: 12.800 kg (ok). Se virar 16.000 kg de uma vez, pode ser exagero.",
  },
  "treino.completedSets": {
    title: "Séries concluídas",
    body: "Ajuda você a não se perder no treino. Quando você marca uma série como feita, o app entende que ela contou para o volume e para a progressão.",
    tips: [
      "Marque a série só depois de terminar (evita bagunçar os dados).",
      "Se marcou errado, desmarque e corrija antes de avançar.",
    ],
    example: "0/15 = você ainda não concluiu séries. 15/15 = treino completo.",
  },
  "treino.rest": {
    title: "Descanso entre séries",
    body: "Tempo para recuperar força antes da próxima série. Descansar bem = mais reps com qualidade.",
    tips: [
      "Compostos pesados (agachamento, supino): 2–3 min.",
      "Isoladores leves (rosca, tríceps): 60–90s.",
      "Se performance cai muito, aumente o descanso.",
    ],
    example: "Supino pesado: descanse 2–3 min. Rosca direta: 60–90s costuma bastar.",
  },
  "treino.repsTarget": {
    title: "Reps alvo",
    body: "É o range ou número de repetições que você deve buscar. Ele existe para padronizar a progressão sem você depender do 'feeling'.",
    tips: [
      "Se estiver no range 6–10: primeiro aumente reps, depois aumente carga.",
      "Se um dia estiver fraco, fique dentro do range com boa técnica.",
    ],
    example: "Range 6–10: hoje fez 8 reps. Próxima sessão tente 9. Quando fizer 10 com boa forma, aumente o peso.",
  },
  "treino.rir": {
    title: "RIR (reps em reserva)",
    body: "RIR é quantas repetições você ainda conseguiria fazer com técnica antes de falhar. Ele garante que você treine pesado sem se destruir.",
    tips: [
      "RIR 2–3 = forte e seguro para a maioria das séries.",
      "Falha (RIR 0) pode ser usada às vezes, mas aumenta fadiga.",
    ],
    example: "Você fez 10 reps e sente que daria mais 2 reps com técnica → RIR 2.",
  },
  "treino.doubleProgression": {
    title: "Progressão (double progression)",
    body: "É a forma mais simples e eficiente de progredir: você sobe reps até o topo do range e só então sobe a carga.",
    tips: [
      "Mantenha a técnica igual. Não vale 'roubar' para subir número.",
      "Suba carga em passos pequenos (ex.: 1–2 kg em halteres, 2,5–5 kg em barra).",
    ],
    example: "Supino 6–10: fez 10,10,9 com RIR 2 → na próxima sessão suba a carga e volte perto de 6–8 reps.",
  },
  "treino.deload": {
    title: "Deload (semana de alívio)",
    body: "Deload é uma semana planejada mais leve para recuperar. Você volta mais forte e continua progredindo.",
    tips: [
      "Reduza 30–50% das séries OU diminua carga mantendo reps fáceis.",
      "Use quando performance cai por várias sessões ou fadiga está alta.",
    ],
    example: "Se você fazia 4 séries por exercício, no deload faz 2. Ou reduz carga ~10–15% mantendo a técnica limpa.",
  },

  // ========== NUTRIÇÃO ==========
  "nutri.calories": {
    title: "Calorias (kcal)",
    body: "Calorias são o 'orçamento' do dia. Para perder gordura, normalmente precisa ficar abaixo do gasto; para ganhar massa, acima.",
    tips: [
      "Não precisa acertar perfeito todo dia. Mire consistência.",
      "Um dia alto não destrói a semana — volte para a rotina.",
    ],
    example: "Meta 2200 kcal. Se comeu 2500 num dia, não precisa compensar com 1500 no outro. Apenas retome 2200.",
  },
  "nutri.macros": {
    title: "Macros (P/C/G)",
    body: "Macros definem a qualidade da sua dieta. Proteína ajuda a manter/ganhar músculo; carbo ajuda performance; gordura mantém saúde hormonal e saciedade.",
    tips: [
      "Priorize proteína diária (é a mais importante).",
      "Se bater calorias mas falhar muito na proteína, ajuste suas escolhas de alimentos.",
    ],
    example: "Meta P 160g. Se você bate 2200 kcal mas só faz 90g de proteína, você perde parte do benefício.",
  },
  "nutri.checkin": {
    title: "Check-in e ajustes",
    body: "O check-in é como o app calibra suas metas com base no seu progresso real. Ajustes são pequenos para manter você no caminho certo sem extremos.",
    tips: [
      "Não ajuste todo dia. Dê tempo para o corpo responder.",
      "Se sua rotina mudou (sono, passos, estresse), isso pode afetar o peso.",
    ],
    example: "Se o objetivo é perder gordura e o peso não muda por 2 semanas, o app pode sugerir -100 kcal/dia.",
  },
  "nutri.goals": {
    title: "Metas nutricionais",
    body: "São suas metas diárias de calorias e macros. Use como guia, não como regra absoluta.",
    tips: [
      "Foque na média semanal, não em um dia perfeito.",
      "Proteína é prioridade. Carbo e gordura são mais flexíveis.",
    ],
    example: "Se a meta é 2200 kcal e 160g proteína, e você bate isso na maioria dos dias, está no caminho certo.",
  },

  // ========== ONBOARDING ==========
  "onboard.bmr": {
    title: "TMB (BMR)",
    body: "É uma estimativa de quantas calorias seu corpo gasta só para existir (repouso). Não é sua meta de dieta — é a base do cálculo.",
    tips: [
      "A TMB não considera treinos e rotina. Por isso existe o TDEE.",
    ],
    example: "TMB 1700 kcal = repouso. Com atividade, seu gasto total diário será maior (TDEE).",
  },
  "onboard.tdee": {
    title: "TDEE (gasto diário total)",
    body: "É a estimativa do seu gasto diário considerando rotina + treinos. A meta de calorias é calculada a partir dele.",
    tips: [
      "Se você treina e anda mais, TDEE sobe. Se fica mais parado, desce.",
      "Por isso o app recalibra com check-ins ao longo do tempo.",
    ],
    example: "TMB 1700 e atividade moderada → TDEE ~2600. Cutting moderado poderia virar ~2200.",
  },
  "onboard.activity": {
    title: "Nível de atividade",
    body: "Considera seu dia a dia (trabalho, deslocamento) e exercícios. Quanto mais ativo, maior seu TDEE.",
    tips: [
      "Seja honesto. Exagerar a atividade dá meta alta demais.",
      "Se você trabalha sentado e só treina 3x/semana, 'moderado' já é generoso.",
    ],
    example: "Sedentário: trabalho de escritório sem exercícios. Ativo: trabalho físico + academia.",
  },
};
