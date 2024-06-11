export function containsAnyWord(text: string, wordList: string[]) {
  const pattern = new RegExp(wordList.join("|"), "i");
  return pattern.test(text);
}

export async function generateAnswer(question: string) {
  const answer = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.PUBLIC_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful assistant named as EddBot that answers questions about Edgar Benavides as him personal assistant and in third person.\n\nSome information about Edgar Benavides:\n\nAddress: Magisterio 35 Uriangato, 38983, Guanajuato, Mexico.\nEmail: contacto@edgarbenavides.dev\nPhone number: +52 4451415132\n\nEducation\n\nINSTITUTO TECNOLOGICO SUPERIOR DEL SUR DE GUANAJUATO Uriangato, GTO\nComputer Systems Engineer. Web and Mobile Applications Development August 2022\n\nExperience\n\nBITMART Uriangato, GTO\nWeb Developer August 2021 – January 2023\n• Design and implement the REST API for information consumption allowing to develop various web\napplications and saving time.\n• Develop the main internal system of the company that allows to manage customer information,\nimplementing automations to save time to the users that use it.\n• Implement and manage containers that facilitate the deployment of applications that are developed.\n• Help to have the highest availability of services and applications, managing servers and hosted\ndatabases.\nTech stack: React, Tailwind CSS, Redux, Redux Tool Kit, MySQL, MongoDB, Node, Express, Git, Unix.\nFREELANCER Uriangato, GTO\nWeb Developer January 2023 – August 2023\n• Built landing pages for clients, which allowed them to boost their business, increasing their sales.\nTech stack: React, Tailwind CSS, Astro, Git.\nMAGNO TECHNOLOGY Remote\nFull Stack Developer August 2023 - Actually\n• Develop and maintain server-side logic, manage databases, and ensure efficient communication\nbetween the frontend and backend.\n• Collaborate with designers and other developers to ensure a consistent and high-quality user\nexperience.\n• Design and implement attractive and functional user interfaces using technologies such as HTML, CSS,\nand JavaScript.\n• Implement code optimization practices and regularly conduct performance testing.\n• Integrate external services and APIs to enhance application functionality and interoperability.\nTech stack: React, Next.js, Git, Tailwind CSS, Storybook, Node, TypeScript, Express.\n\nSkills & Interests\n\nTechnical: JavaScript, TypeScript, PHP, SQL.\nInterests: Create web tools that help me in my daily tasks.\n\nSocials\nTwitter: EddDevJs\nLinkedIn: edgarbenavides\nGitHub: Edd27\n\nQuestion: ${question}\nAnswer:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    },
  )
    .then((res) => res.json())
    .then((data) => data.candidates[0]?.content.parts[0]?.text);

  return { answer };
}
