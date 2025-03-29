from fastapi import FastAPI, File, UploadFile
import cv2
import numpy as np
import time
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from pykakasi import kakasi
from alphabet2kana import a2k

app = FastAPI()

# CORSの設定を追加
app.add_middleware(
    CORSMiddleware,
    allow_origins="*",  # すべてのオリジンを許可する場合
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可 (GET, POSTなど)
    allow_headers=["*"],  # すべてのHTTPヘッダーを許可
)
    

eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")


closed_eye_time = 0
last_eye_open_time = time.time()
sleep_threshold = 20  # 3秒以上目を閉じたら居眠り判定


@app.post("/analyze")
async def analyze_video(frame: UploadFile = File(...)):
    global closed_eye_time, last_eye_open_time

    # 画像データを取得
    image = np.asarray(bytearray(await frame.read()), dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 目を検出
    eyes = eye_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    print(eyes)

    if len(eyes) == 0:
        # 目が閉じていると判定
        if closed_eye_time == 0:
            closed_eye_time = time.time()
        elapsed_time = time.time() - closed_eye_time
        
        print("elapsed_time:", elapsed_time)

        if elapsed_time >= sleep_threshold:
            print("居眠りしています")
            send_discord_alert()
            return {"status": "True"}
        print("目をつぶっています")
        return {"status": "False"}
    else:
        # 目が開いているので時間をリセット
        closed_eye_time = 0
        last_eye_open_time = time.time()
        print("起きています")
        return {"status": "False"}


class RequestData(BaseModel):
    message: str


@app.post("/process")
async def process_data(data: RequestData):
    # Kakasiオブジェクトをインスタンス化
    kakasi_instance = kakasi()  # 修正

    # モードの設定：J(Kanji) to a(Katakana)
    kakasi_instance.setMode("J", "K")
    kakasi_instance.setMode("H", "K")
    kakasi_instance.setMode("a", "K")
    kakasi_instance.setMode("E", "K")
    
    # 変換用のコンバーターを取得
    conv = kakasi_instance.getConverter()

    # 文字列をカタカナに変換
    converted_text = conv.do(data.message)
    
    # アルファベットをカタカナに変換
    converted_text_kata = a2k(converted_text)

    print(converted_text_kata)

    return {"message": converted_text_kata}