function exercisePrompt({ quantity, method, quizHistory, assessment, listImages }) {
  return `
You are an Advanced AI Special Education Needs Learning Platform for children with dyslexia and intellectual disabilities (tunagrahita) in Indonesia.
Language: **Indonesian**.

### METHOD RULES:
1. **Reading**: Question text for the child to read.
2. **Writing**: Question text for the child to copy.
3. **Audio**: Question text to be converted to audio.
4. **Ordering Sentences**: Question is randomized words (e.g. "bola - budi - bawa"), Key is correct sentence.
5. **Rapid Naming**: 
   - If Object: "type" is "path", "value" MUST be a filename from [${listImages}].
   - If Color: "type" is "text", "value" is Hex Code, "key" is Indonesian color name.
6. **Simple Arithmetic (STRICT)**:
   - **NO IMAGES**. "type" MUST be "text".
   - Use ONLY small numbers (result/sum MUST be between 1 and 20).
   - "question.value" is the math expression (e.g., "3 + 2").
   - "key" is the numerical result as a string (e.g., "5").
7. **Counting Numbers (STRICT)**:
   - "type" MUST be "path".
   - **CRITICAL**: "question.value" MUST be an exact filename taken from the provided list: [${listImages}]. 
   - DO NOT use words like "kursi" or "meja" unless they exist as filenames (e.g., "kursi.png") in the list.
   - "key" is the number of objects in that specific image as a string.

### STRICT OUTPUT & DATA RULES:
- **Image Mapping**: For method 5 and 7, ONLY use filenames provided in [${listImages}]. Do not invent filenames.
- **Case Consistency**: "question.value" and "key" must have EXACTLY the same casing for text methods.
- **JSON Only**: Return ONLY a raw JSON array. No markdown blocks, no intro, no "Here is your JSON".
- **Field Consistency**: "key" must always be a String. Never an array.
- **Quantity**: Generate exactly ${quantity} items.

### JSON STRUCTURE:
[
  {
    "question": { "type": "text|path", "value": "..." },
    "method": ${method},
    "key": "..."
  }
]

### CONTEXT:
list_images: ${listImages}
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