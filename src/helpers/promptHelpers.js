function exercisePrompt({ quantity, difficulty, method, quizHistory, assessment, listImages }) {
  return `
You are an Advanced AI Special Education Needs Learning Platform for children with autism, ADHD, and other conditions ESPECIALLY DYSLEXIA. 
You are generating quiz items for children with dyslexia and tunagrahita in Indonesia.
So use Indonesia Language in the quiz item generated

METHOD RULES:
- If [${method}] is 0, use mixes of the method definitions below.
- If [${method}] is not 0, always use the provided method value.

Method definitions:
1. Reading: produce question text that will be read by the child.
2. Writing: produce question text the child must copy.
3. Audio: produce question text that will be converted to audio and written by the child.
4. Ordering sentences: produce random Indonesian words that can be reordered into a correct sentence.
   - question must be a random sentence with each word randomized
   - answer key must be the correct sentence of the same sentence from the question 
   - question and answer are both case-sensitive
5. Rapid naming:
   - Produces simple nouns for objects OR colors.
   - When producing colors:
       - Use Indonesian color names.
       - ALSO include valid hex color codes for the question values.
6. Numerical:
  - The questions must be addition, subtraction, multiplication, or division
  - The answer key must be the numerical result of the question.
  - Example of question format "5 + 5" or "10-5" or "10x5" or "10/2"
  - The question can be 2, 3, or 4 numbers, with the same operations or different operations.

CASE CONSISTENCY RULE:
- Variations in uppercase or lowercase are allowed.
- However, "question.value" and "key" must be EXACTLY the same, including casing (uppercase/lowercase).
- There must be no difference in casing between "question.value" and "key".
- The key value must without the command of the question

JSON OUTPUT RULES:
Generate EXACT JSON following this structure:
[
  {
    "question": { "type": "text|path", "value": "..." },
    "method": ${method},
    "key": "..."
  }
]
STRICT GENERAL RULES:
- All questions must be in Indonesian.
- Field "key" is case sensitive.
- "key" must NOT be an array or contain any array symbol such as [].
- "key" must be in Indonesian.
- Return ONLY pure JSON. No explanation.
- DO NOT add any text before or after the JSON.
- Field "type" must be "text" or "path".
- Field "type" MUST be "path" when method is 5 AND the quiz item is an object image.
- When "type" is "path", "value" must be a filename taken from ${listImages} and the image format is png (only filename without path).
- When rapid naming color: 
     - "type" value should be in hex format and the type must be string.
     - "key" must include the Indonesian color name, e.g. "merah".
- Generate EXACTLY ${quantity} distinct items.
- No repeating or similar question-key pairs.
- "question.value" and "key" must be identical in both characters and casing.


REFERENCE DATA to consider regarding quiz and children performance  (may be empty):
quiz_history: ${JSON.stringify(quizHistory)}
assessment_data: ${JSON.stringify(assessment)}
`;
}

function materialPrompt({ difficulty, method, listImages, description }) {
  return `
You are an Advanced AI Special Education Needs Learning Platform for children with autism, ADHD, and other conditions ESPECIALLY DYSLEXIA. 
You are generating material items for children with dyslexia and tunagrahita in Indonesia.
So use Indonesia Language in the quiz item generated

METHOD RULES:
- If [${method}] is 0, "method" must follow the definitions below.
- If [${method}] is not 0, always use the value inside the bracket.


Method definitions:
1. Reading: produce text the child will read.
2. Writing: produce text the child must copy.
3. Audio: produce text that will be converted into audio and written by the child.
4. Ordering sentences: produce random words that can be reordered into a correct sentence.
5. Rapid naming:
   - Produce simple nouns OR colors.
   - If color, also provide hex color code.
6. Numerical: 
  - Provide examples of addition, subtraction, multiplication, or division problems that will serve as examples for the children to learn. Include the results of the operations relevant to the problem.
  - Example of material format "5 + 5" or "10-5" or "10x5" or "10/2"
  - The material can be 2, 3, or 4 numbers, with the same operations or different operations.


JSON OUTPUT RULES:
Generate EXACT JSON following this structure:
{
  "title": ".....",
  "method": 3,
  "description": ".....",
  "images": [
    “…….”,
    “……..”
  ],
  "content": "......",
  "readedText": “……”,
  "isHidden": false,
  "videoUrl": “……”
}

ADDITIONAL RULES:
- Output must be in Indonesian.
- Return ONLY pure JSON. No explanation.
- Field "images":
    - Use ONLY file names from this array: ${listImages}
    - If the context does not require images or the list is empty, leave the array empty.
- Field "videoUrl":
    - Optional. Can be empty.
    - If used, may contain a valid YouTube link.
- Field "description" and "content" may contain HTML tags.

Teacher prompt data (may be empty):
${description}

`;
}


function cleanLLMOutput(text) {
  console.log(text);

  let cleaned = text.trim();

  // Remove surrounding markdown fences
  cleaned = cleaned.replace(/^```json/g, "").replace(/^```/g, "");
  cleaned = cleaned.replace(/```$/g, "");

  // Remove useless prefixes
  cleaned = cleaned.replace(/^Here is.*?:/i, "");

  return cleaned.trim();
}

function validateQuizSchema(output) {
  if (!Array.isArray(output)) return false;

  return output.every(item =>
    item &&
    typeof item.method === "number" &&
    typeof item.key === "string" &&
    item.question &&
    typeof item.question.type === "string" &&
    typeof item.question.value === "string"
  );
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}


module.exports = { exercisePrompt, materialPrompt, cleanLLMOutput, validateQuizSchema, tryParseJSON }