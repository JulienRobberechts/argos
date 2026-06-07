export type ChunkCase = {
  text: string;
  size: number;
  overlap?: number;
  expected: string[];
};

export const recursiveCases: ChunkCase[] = [
  {
    text: "",
    size: 10,
    expected: [],
  },
  {
    text: "hello world",
    size: 100,
    expected: ["hello world"],
  },
  {
    text: "a b c d\n\ne f g h i j k l m n",
    size: 5,
    expected: ["a b c d", "f g h i", "k l m n"],
  },
  {
    text: "hello world foo bar baz",
    size: 3,
    expected: ["hello world", "bar baz"],
  },
];

export const sentenceCases: ChunkCase[] = [
  {
    text: "",
    size: 10,
    expected: [],
  },
  {
    text: "Bonjour monde. Ceci est un test.",
    size: 100,
    expected: ["Bonjour monde. Ceci est un test."],
  },
  {
    text: "A b c. D e f. G h i. J k l.",
    size: 6,
    overlap: 3,
    expected: ["A b c. D e f.", "D e f. G h i.", "G h i. J k l.", "J k l."],
  },
  {
    text: "A b c. D e f. G h i.",
    size: 6,
    overlap: 0,
    expected: ["A b c. D e f.", "G h i."],
  },
  {
    text: "Le train fut créé en 1883. Il reliait Paris. Le service cessa en 1977.",
    size: 8,
    overlap: 3,
    expected: [
      "Le train fut créé en 1883.",
      "Il reliait Paris. Le service cessa en 1977.",
    ],
  },
];
