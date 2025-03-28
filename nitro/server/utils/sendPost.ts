import { ConvertedUserSpell } from "~/types";

export const sendPost = async (
  endpoint: string,
  message: string
): Promise<ConvertedUserSpell> => {
  const url = `http://localhost:8000${endpoint}`;
  const sendData = { message: message };

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sendData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("ネットワーク応答が正常ではありません");
      }
      return response.json();
    })
    .then((data) => {
      return { message: data.message } as ConvertedUserSpell;
    })
    .catch((error) => {
      console.error("Error:", error);
      throw error;
    });
};
