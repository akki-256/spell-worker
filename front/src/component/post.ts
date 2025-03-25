export const post = (endpoint: string, message: string) => {
  const url = `http://localhost:8000${endpoint}`;
  const sendData = { message: message };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    //JSON形式で送る
    body: JSON.stringify(sendData),
  })
    //接続できたかの確認
    .then((response) => {
      if (!response.ok) {
        throw new Error('ネットワーク応答が正常ではありません');
      }
      return response.json();
    })
    //ここのdataにレスポンスの値が入っている
    .then((data) => {
      console.log('Success:', data);
    })
    //エラーであった場合
    .catch((error) => {
      console.error('Error:', error);
    });
};
