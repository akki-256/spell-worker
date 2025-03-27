import { useEffect, useRef, useState } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import setServer from './component/setServer'
import setUpSpell from './component/setUpSpell'
import useSound from 'use-sound'
import defaultAlarmSound from '../default-alarm-sound.mp3'

const settimer = ((count: number) => {
  let h = Math.floor(count / 3600).toString()
  let m = Math.floor((count / 60) % 60).toString().padStart(2, '0')
  let s = Math.floor(count % 60).toString().padStart(2, '0')
  return [h, m, s]
});

export const usedSpell = setUpSpell(2)

type nitroResType = {
  magicSuccess: string
  isMoving: boolean
}

const post = async (url: string, blob: Blob) => {
  const formData = new FormData();
  formData.append("file", blob);

  await fetch(url, {
    method: "POST",
    body: formData,
  });
};


const App = () => {
  const [counter, setCounter] = useState(0)//カウントアップ用
  const stopCounter = useRef(-1)
  const [nitroRes, setnitroRes] = useState<nitroResType>()
  const [pyRes, setPyres] = useState(false)
  const nitroSocketRef = useRef<ReconnectingWebSocket>(null)//webSocket使用用
  const [dispState, setDispState] = useState<string>('title')
  const videoRef = useRef<HTMLVideoElement | null>(document.createElement('video'))
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const {
    finalTranscript,
    browserSupportsSpeechRecognition,
    resetTranscript,
    isMicrophoneAvailable,
  } = useSpeechRecognition();//音声テキスト化API
  const [play, { stop, sound }] = useSound(defaultAlarmSound, {
    playbackRate: 1.0, // 標準の再生速度
    volume: 1,
    interrupt: true,
    loop: true
  })

  //初回レンダリング時
  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true, language: 'ja' })//音声テキスト化の有効化
    nitroSocketRef.current = setServer('ws://localhost:3000/spell/ws', setnitroRes)
    const sendUsedSpell = setServer('ws://localhost:3000/:setup/ws')
    sendUsedSpell.send(JSON.stringify(usedSpell))

    let stream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [])

  const captureFrame = async () => {
    if (!videoRef.current) return;
    if (!canvasRef.current) return;

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    const ctx = ctxRef.current ?? canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasRef.current.toBlob((b) => resolve(b), 'image/jpeg')
    })
    if (blob) sendFrame(blob)
  };

  const sendFrame = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('frame', blob);

    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    console.log(result);
  };

  useEffect(() => {
    //タイトルをクリックした後、杖を振って魔法を言ったらwork画面に移行
    if ((dispState === 'start') && nitroRes?.isMoving && (finalTranscript.includes('スペルワーカー'))) {
      setDispState('work')
      const interval = setInterval(() => {
        setCounter(prev => prev + 1);
        captureFrame()
      }, 1000);
      return () => clearInterval(interval);
    }
    if (finalTranscript !== '' && nitroSocketRef.current?.readyState === WebSocket.OPEN) {
      const sendMessage = finalTranscript.replace(/\s+/g, '')
      nitroSocketRef.current?.send(sendMessage)
      resetTranscript();
    } else if (nitroSocketRef.current?.readyState !== WebSocket.OPEN) {
      nitroSocketRef.current?.reconnect()
    }
  }, [finalTranscript])

  useEffect(() => {
    if (nitroRes?.magicSuccess === 'void1') {
      window.location.reload()
    } else if (nitroRes?.magicSuccess === 'void2') {
      stopCount()
    } else if (nitroRes?.magicSuccess === 'void3') {
      startCount()
    } else if (nitroRes?.magicSuccess === 'void4' && sound?.isPlayng) {
      stopalerm()
    }
  }, [nitroRes])

  useEffect(() => {
    if (pyRes) {
      setDispState('sleep')
      console.log('aaa')
      if (pyRes) play()
    }
  }, [pyRes])

  const stopCount = () => {
    stopCounter.current = counter
  }
  const startCount = () => {
    setCounter(stopCounter.current)
    stopCounter.current = -1
  }
  const stopalerm = () => {
    stop()
    setDispState('work')
  }

  //推奨環境
  if (!browserSupportsSpeechRecognition) {
    return <span>お使いのブラウザでは音声入力が使用できません:推奨 Google Chrome</span>;
  } else if (!isMicrophoneAvailable) {
    return <span>マイクの使用許可をください</span>
  }

  return (
    <>
      {dispState === 'title' &&
        <div>
          <img src='SpellWorker Wand.svg' />
          <div>SpellWorler</div>
          <div onClick={() => setDispState('start')}>クリックして魔法を使ってスタート</div>
        </div>
      }
      {dispState === 'start' &&
        <div>
          <div>SpellWorker</div>
          <div>zyumon(仮:スペルワーカー)</div>
          <div>魔法を使おう</div>
          <div onClick={() => {
            setDispState('work')
            const interval = setInterval(() => {
              console.log('カウントアップ')
              setCounter(prev => prev + 1);
              captureFrame()
            }, 1000);
            return () => clearInterval(interval);
          }}>デバック用</div>
        </div>
      }
      {dispState === 'work' &&
        <>
          <img src='SpellWorker Wand.svg' />
          <div>Spellwoker</div>
          <div>
            <div>
              <div>HOURS</div>
              <div>{settimer(stopCounter.current < 0 ? counter : stopCounter.current)[0]}</div>
            </div>
            <div>:
              <div>MINITS</div>
              <div>{settimer(stopCounter.current < 0 ? counter : stopCounter.current)[1]}</div>
            </div>
            <div>:
              <div>SECONDS</div>
              <div>{settimer(stopCounter.current < 0 ? counter : stopCounter.current)[2]}</div>
            </div>
          </div>
          <button onClick={() => window.location.reload()}>
            <img src='/SpellWorker Group 12.png' />
            <div>終了</div>
            <div>{JSON.stringify(usedSpell.void1)}</div>
          </button>
          {stopCounter.current! < 0 ?
            <button onClick={() => stopCount()}>
              <img src='/SpellWorker Group 10.png' />
              <div>停止</div>
              <div>{JSON.stringify(usedSpell.void2)}</div>
            </button>
            :
            <button onClick={() => startCount()}>
              <img src='/SpellWorker Group 13.png' />
              <div>開始</div>
              <div>{JSON.stringify(usedSpell.void2)}</div>
            </button>
          }
          <div>呪文一覧</div>
          <div>{JSON.stringify(usedSpell)}</div>
          <div>{finalTranscript}</div>
          <div>{JSON.stringify(usedSpell.void1)}</div>
          <div>{JSON.stringify(usedSpell.void2)}</div>
          <div onClick={() => setPyres(true)}>ooo</div>
        </>
      }
      {dispState === 'sleep' &&
        <>
          <div>睡眠を検知 起きてください</div>
          <div>魔法を使ってアラームを止める</div>
          <div>デバック</div>
          <div onClick={() => { setDispState('work'); stop() }}>mmm</div>
        </>
      }
    </>
  )
}

export default App