export type FoodItem = {
  id: string;
  nome: string;
  unidadeBase: "g" | "un" | "ml" | "scoop";
  porcaoBase: number;
  kcal: number;
  p: number; // proteína
  c: number; // carbo
  g: number; // gordura
  tags?: string[];
};

export const foods: FoodItem[] = [
  // Proteínas
  { id: "frango-grelhado", nome: "Frango grelhado", unidadeBase: "g", porcaoBase: 100, kcal: 165, p: 31, c: 0, g: 4, tags: ["proteína", "almoço", "jantar"] },
  { id: "carne-magra", nome: "Carne magra (patinho)", unidadeBase: "g", porcaoBase: 100, kcal: 135, p: 26, c: 0, g: 3, tags: ["proteína", "almoço", "jantar"] },
  { id: "ovo-inteiro", nome: "Ovo inteiro", unidadeBase: "un", porcaoBase: 1, kcal: 70, p: 6, c: 0, g: 5, tags: ["proteína", "café da manhã"] },
  { id: "ovo-clara", nome: "Clara de ovo", unidadeBase: "un", porcaoBase: 1, kcal: 17, p: 4, c: 0, g: 0, tags: ["proteína", "café da manhã"] },
  { id: "whey-protein", nome: "Whey protein", unidadeBase: "scoop", porcaoBase: 1, kcal: 120, p: 24, c: 3, g: 1, tags: ["proteína", "suplemento"] },
  { id: "peito-peru", nome: "Peito de peru", unidadeBase: "g", porcaoBase: 100, kcal: 104, p: 22, c: 1, g: 1, tags: ["proteína", "café da manhã"] },
  { id: "atum-lata", nome: "Atum em lata (água)", unidadeBase: "g", porcaoBase: 100, kcal: 116, p: 26, c: 0, g: 1, tags: ["proteína", "almoço"] },
  { id: "tilapia", nome: "Filé de tilápia", unidadeBase: "g", porcaoBase: 100, kcal: 96, p: 20, c: 0, g: 2, tags: ["proteína", "almoço", "jantar"] },
  
  // Carboidratos
  { id: "arroz-cozido", nome: "Arroz branco cozido", unidadeBase: "g", porcaoBase: 100, kcal: 130, p: 2, c: 28, g: 0, tags: ["carboidrato", "almoço", "jantar"] },
  { id: "arroz-integral", nome: "Arroz integral cozido", unidadeBase: "g", porcaoBase: 100, kcal: 111, p: 3, c: 23, g: 1, tags: ["carboidrato", "almoço", "jantar"] },
  { id: "feijao-cozido", nome: "Feijão cozido", unidadeBase: "g", porcaoBase: 100, kcal: 77, p: 5, c: 14, g: 0, tags: ["carboidrato", "almoço", "jantar"] },
  { id: "batata-doce", nome: "Batata doce cozida", unidadeBase: "g", porcaoBase: 100, kcal: 86, p: 2, c: 20, g: 0, tags: ["carboidrato", "almoço", "jantar"] },
  { id: "batata-inglesa", nome: "Batata inglesa cozida", unidadeBase: "g", porcaoBase: 100, kcal: 87, p: 2, c: 20, g: 0, tags: ["carboidrato", "almoço", "jantar"] },
  { id: "pao-integral", nome: "Pão integral", unidadeBase: "un", porcaoBase: 1, kcal: 70, p: 3, c: 13, g: 1, tags: ["carboidrato", "café da manhã"] },
  { id: "pao-frances", nome: "Pão francês", unidadeBase: "un", porcaoBase: 1, kcal: 135, p: 4, c: 28, g: 1, tags: ["carboidrato", "café da manhã"] },
  { id: "aveia-flocos", nome: "Aveia em flocos", unidadeBase: "g", porcaoBase: 30, kcal: 117, p: 4, c: 20, g: 2, tags: ["carboidrato", "café da manhã"] },
  { id: "macarrao-cozido", nome: "Macarrão cozido", unidadeBase: "g", porcaoBase: 100, kcal: 158, p: 5, c: 31, g: 1, tags: ["carboidrato", "almoço", "jantar"] },
  { id: "tapioca", nome: "Tapioca (goma)", unidadeBase: "g", porcaoBase: 30, kcal: 100, p: 0, c: 26, g: 0, tags: ["carboidrato", "café da manhã"] },
  
  // Frutas
  { id: "banana", nome: "Banana", unidadeBase: "un", porcaoBase: 1, kcal: 105, p: 1, c: 27, g: 0, tags: ["fruta", "lanche"] },
  { id: "maca", nome: "Maçã", unidadeBase: "un", porcaoBase: 1, kcal: 95, p: 0, c: 25, g: 0, tags: ["fruta", "lanche"] },
  { id: "laranja", nome: "Laranja", unidadeBase: "un", porcaoBase: 1, kcal: 62, p: 1, c: 15, g: 0, tags: ["fruta", "lanche"] },
  { id: "morango", nome: "Morango", unidadeBase: "g", porcaoBase: 100, kcal: 32, p: 1, c: 8, g: 0, tags: ["fruta", "lanche"] },
  { id: "mamao", nome: "Mamão papaia", unidadeBase: "g", porcaoBase: 100, kcal: 40, p: 0, c: 10, g: 0, tags: ["fruta", "café da manhã"] },
  
  // Laticínios
  { id: "leite-integral", nome: "Leite integral", unidadeBase: "ml", porcaoBase: 200, kcal: 124, p: 6, c: 10, g: 6, tags: ["laticínio", "café da manhã"] },
  { id: "leite-desnatado", nome: "Leite desnatado", unidadeBase: "ml", porcaoBase: 200, kcal: 68, p: 7, c: 10, g: 0, tags: ["laticínio", "café da manhã"] },
  { id: "iogurte-natural", nome: "Iogurte natural", unidadeBase: "g", porcaoBase: 170, kcal: 100, p: 17, c: 6, g: 1, tags: ["laticínio", "lanche", "proteína"] },
  { id: "iogurte-grego", nome: "Iogurte grego", unidadeBase: "g", porcaoBase: 170, kcal: 130, p: 15, c: 8, g: 4, tags: ["laticínio", "lanche", "proteína"] },
  { id: "queijo-minas", nome: "Queijo minas", unidadeBase: "g", porcaoBase: 30, kcal: 70, p: 6, c: 1, g: 5, tags: ["laticínio", "café da manhã"] },
  { id: "queijo-cottage", nome: "Queijo cottage", unidadeBase: "g", porcaoBase: 100, kcal: 98, p: 11, c: 3, g: 4, tags: ["laticínio", "proteína"] },
  { id: "requeijao-light", nome: "Requeijão light", unidadeBase: "g", porcaoBase: 30, kcal: 45, p: 2, c: 1, g: 4, tags: ["laticínio", "café da manhã"] },
  
  // Gorduras saudáveis
  { id: "azeite-oliva", nome: "Azeite de oliva", unidadeBase: "ml", porcaoBase: 10, kcal: 88, p: 0, c: 0, g: 10, tags: ["gordura", "almoço", "jantar"] },
  { id: "pasta-amendoim", nome: "Pasta de amendoim", unidadeBase: "g", porcaoBase: 20, kcal: 118, p: 5, c: 4, g: 10, tags: ["gordura", "lanche", "café da manhã"] },
  { id: "castanha-caju", nome: "Castanha de caju", unidadeBase: "g", porcaoBase: 30, kcal: 157, p: 5, c: 9, g: 12, tags: ["gordura", "lanche"] },
  { id: "amendoim", nome: "Amendoim torrado", unidadeBase: "g", porcaoBase: 30, kcal: 170, p: 7, c: 5, g: 14, tags: ["gordura", "lanche"] },
  { id: "abacate", nome: "Abacate", unidadeBase: "g", porcaoBase: 100, kcal: 160, p: 2, c: 9, g: 15, tags: ["gordura", "fruta"] },
  
  // Vegetais
  { id: "brocolis", nome: "Brócolis cozido", unidadeBase: "g", porcaoBase: 100, kcal: 35, p: 4, c: 7, g: 0, tags: ["vegetal", "almoço", "jantar"] },
  { id: "salada-mista", nome: "Salada mista", unidadeBase: "g", porcaoBase: 100, kcal: 20, p: 1, c: 4, g: 0, tags: ["vegetal", "almoço", "jantar"] },
  { id: "tomate", nome: "Tomate", unidadeBase: "g", porcaoBase: 100, kcal: 18, p: 1, c: 4, g: 0, tags: ["vegetal", "almoço", "jantar"] },
  { id: "cenoura", nome: "Cenoura crua", unidadeBase: "g", porcaoBase: 100, kcal: 41, p: 1, c: 10, g: 0, tags: ["vegetal", "almoço", "jantar"] },
  
  // Outros
  { id: "granola", nome: "Granola", unidadeBase: "g", porcaoBase: 40, kcal: 160, p: 4, c: 28, g: 5, tags: ["café da manhã", "carboidrato"] },
  { id: "mel", nome: "Mel", unidadeBase: "g", porcaoBase: 20, kcal: 64, p: 0, c: 17, g: 0, tags: ["café da manhã", "carboidrato"] },
];

export function getFoodById(id: string): FoodItem | undefined {
  return foods.find(f => f.id === id);
}

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return foods;
  const q = query.toLowerCase();
  return foods.filter(f => f.nome.toLowerCase().includes(q));
}
