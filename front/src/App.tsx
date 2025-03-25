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

const App = () => {
  const [counter, setCounter] = useState(0)//カウントアップ用
  const stopCounter = useRef(-1)
  const [nitroRes, setnitroRes] = useState<nitroResType>()
  const [pyRes, setPyres] = useState(false)
  const nitroSocketRef = useRef<ReconnectingWebSocket>(null)//webSocket使用用
  const pySocketRef = useRef<ReconnectingWebSocket>(null)
  const mediaRecorderREf = useRef<MediaRecorder | null>(null)
  const [dispState, setDispState] = useState<string>('title')
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
    console.log('初回レンダリング')
    SpeechRecognition.startListening({ continuous: true, language: 'ja' })//音声テキスト化の有効化
    nitroSocketRef.current = setServer('ws://spell', setnitroRes)
    // handStick.current = setServer('ws://handstick', sethandingStick)
    const sendUsedSpell = setServer('ws://localhost:setup')
    sendUsedSpell.send(JSON.stringify(usedSpell))
    pySocketRef.current = setServer('ws://localhost:8000/ws', setPyres)
    const startRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });//カメラの使用許可、入力を取得
      mediaRecorderREf.current = new MediaRecorder(stream, { mimeType: "video/webm" });//録画を管理するオブジェクトのインスタンスを作成
      mediaRecorderREf.current.ondataavailable = (event) => {//録音データが利用可能になるたび
        if (pySocketRef.current?.readyState === WebSocket.OPEN) {
          pySocketRef.current?.send(event.data)
        } else {
          pySocketRef.current?.reconnect()
        }
      };
      mediaRecorderREf.current.start(1000);//実際にはここで録音開始
    };
    startRecording()
  }, [])

  useEffect(() => {
    //タイトルをクリックした後、杖を振って魔法を言ったらwork画面に移行
    if ((dispState === 'start') && nitroRes?.isMoving && (finalTranscript.includes('スペルワーカー'))) {
      setDispState('work')
      const interval = setInterval(() => {
        setCounter(prev => prev + 1);
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
              setCounter(prev => prev + 1);
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