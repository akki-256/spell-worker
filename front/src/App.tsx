import { useEffect, useRef, useState } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import setServer from './component/setServer'
import setUpSpell from './component/setUpSpell'
import useSound from 'use-sound'
import defaultAlarmSound from '../default-alarm-sound.mp3'
import { captureAndSendPY } from './component/captureandsend'
import wandImage from "../public/SpellWorker Wand.svg";
import cloud from "../public/cloud.svg";
import "../src/App.css";
import "@fontsource/MedievalSharp";
import { RxCross2 } from "react-icons/rx";
import { PiPlayBold } from "react-icons/pi";
import { TbPlayerPause } from "react-icons/tb";
import { FiSun } from "react-icons/fi";
import { FiAlertTriangle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const NITRO_SPELLSUCCESS_URL = 'ws://localhost:3000/spell'
const NITRO_SETUP_SPELL_URL = 'ws://localhost:3000/setup'
const NITRO_HANDLING_URL = 'http://localhost:3000/handle'
const PYTHON_SLEEP_URL = 'http://localhost:8000/analyze'
const N_OF_USED_SPELL = 4

const settimer = ((count: number) => {
  let h = Math.floor(count / 3600).toString().padStart(2, '0')
  let m = Math.floor((count / 60) % 60).toString().padStart(2, '0')
  let s = Math.floor(count % 60).toString().padStart(2, '0')
  return [h, m, s]
});

export const usedSpell = setUpSpell(N_OF_USED_SPELL)

type nitroResType = {
  "user": string,
  "message": string | nitrosMessageType
}

type nitrosMessageType = {
  "magicSuccess": string | null,
  "isMoving": boolean
}

interface ImageStyle {
  width: string;
  height: string;
  top: string;
  left: string;
  transform: string;
  opacity: number;
  zIndex: number;
}

interface DisplayImage {
  url: string;
  style: ImageStyle;
}

const App = () => {
  const [counter, setCounter] = useState<number>(0)//カウントアップ用
  const stopCounter = useRef([0, 0])
  // const [nitroRes, setnitroRes] = useState<string>('{"user":"default","message":"default"}')
  const [nitroRes, setnitroRes] = useState<nitroResType>({ "user": "default", "message": "default" })
  const [pyRes, setPyres] = useState("False")
  const nitroSocketRef = useRef<ReconnectingWebSocket>(null)//webSocket使用用
  const [handling, setHandling] = useState<string>('false')
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
    volume: 10,
    interrupt: true,
    loop: true
  })

  const stopCount = () => {
    stopCounter.current = [counter, 1]
  }
  const startCount = () => {
    setCounter(stopCounter.current[0])
    stopCounter.current[1] = 0
  }
  const stopAlerm = () => {
    stop()
    startCount()
    setDispState('work')
  }

  //初回レンダリング時
  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true, language: 'ja' })//音声テキスト化の有効化
    nitroSocketRef.current = setServer(NITRO_SPELLSUCCESS_URL, setnitroRes)
    const handlingSSE = new EventSource(NITRO_HANDLING_URL)
    handlingSSE.onmessage = (event) => setHandling(event.data)
    const sendUsedSpell = setServer(NITRO_SETUP_SPELL_URL)
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
      SpeechRecognition.stopListening()
    };
  }, [])

  useEffect(() => {

    console.log('fainaltranscript', finalTranscript)
    if (finalTranscript !== '' && nitroSocketRef.current?.readyState === WebSocket.OPEN) {
      const sendMessage = finalTranscript.replace(/\s+/g, '')
      nitroSocketRef.current?.send(sendMessage)
      resetTranscript();
    } else if (nitroSocketRef.current?.readyState !== WebSocket.OPEN) {
      nitroSocketRef.current?.reconnect()
    }
    if (dispState === 'start' && handling === 'true' && finalTranscript.includes('スペルワーカー')) {
      console.log('workに移動')
      //タイトルをクリックした後、杖を振って魔法を言ったらwork画面に移行
      setDispState('work')
      setCounter(0)
    }
  }, [finalTranscript])

  useEffect(() => {
    if (dispState === 'work' && (nitroRes.message as nitrosMessageType)?.magicSuccess) {
      console.log((nitroRes.message as nitrosMessageType)?.magicSuccess);
      switch ((nitroRes.message as nitrosMessageType)?.magicSuccess) {
        case 'void1': window.location.reload()
          break
        case 'void2': stopCount()
          break
        case 'void3': startCount()
          break
      }
    }
    if ((dispState === 'sleep') && (nitroRes.message as nitrosMessageType)?.magicSuccess === 'void4') {
      stopAlerm()
    }
  }, [nitroRes])

  useEffect(() => {
    if (pyRes === "True") {
      stopCount()
      setDispState('sleep')
      shuffleImages();
      if (sound) play()
    }
  }, [pyRes])

  // アニメーション
  const pageFade0 = ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1 } },
    exit: { opacity: 0, transition: { duration: 1 } },
  });
  const pageFade1 = ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1, delay: 1 }, },
    exit: { opacity: 0, transition: { duration: 1 } },
  });
  const pageFade2 = ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1, delay: 5 }, },
    exit: { opacity: 0, transition: { duration: 1 } },
  });

  //光の粒の表示
  const [lights, setLights] = useState<{ id: number; left: string; duration: number; delay: number }[]>([]);
  const getRandomLeft = () => `${Math.random() * 100}vw`;

  useEffect(() => {
    const addLight = () => {
      const id = Date.now();
      const newLight = {
        id,
        left: getRandomLeft(),
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 2,
      };

      setLights((prevLights) => [...prevLights, newLight]);

      setTimeout(() => {
        setLights((prevLights) => prevLights.filter((light) => light.id !== id));
      }, (newLight.duration + newLight.delay) * 1000);
    };

    const interval = setInterval(addLight, 350);

    return () => clearInterval(interval);
  }, []);

  //推奨環境
  if (!browserSupportsSpeechRecognition) {
    return <span>お使いのブラウザでは音声入力が使用できません:推奨 Google Chrome</span>;
  } else if (!isMicrophoneAvailable) {
    return <span>マイクの使用許可をください</span>
  }

  return (
    <div>
      {/* {lights.map((light) => (
        <span
          key={light.id}
          className="light"
          style={{
            left: light.left,
            animationDuration: `${light.duration}s`,
            animationDelay: `${light.delay}s`,
          }}
        />
      ))} */}
      <AnimatePresence>
        {dispState === 'title' &&
          <motion.div
            key="title"
            variants={pageFade0}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container"
          >
            <img src={wandImage} alt="Magic Wand" className="wand" />
            <h1 className="title">SpellWorker</h1>
            <p className="subtitle">Stay Awake with Magic</p>
            <div className="spell-button" onClick={() => setDispState('start')}>Click to Ready Spell</div>
          </motion.div>
        }
        {dispState === 'start' &&
          <motion.div
            key="start"
            variants={pageFade1}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container"
          >
            <h1 className="title">呪文</h1>
            <p className="subtitle" onClick={() => {
              setDispState('work')
              const interval = setInterval(() => {
                setCounter(prev => prev + 1);
                captureAndSendPY(videoRef, canvasRef, ctxRef, PYTHON_SLEEP_URL, setPyres)
              }, 1000);
              return () => clearInterval(interval);
            }}>Cast Opening Spell</p>
          </motion.div>
        }
        {(dispState === 'work' || dispState === 'sleep') &&
          <motion.div
            key="work"
            variants={pageFade1}
            initial="initial"
            animate="animate"
            exit="exit"
            className="work-container"
          >
            <div className='work-page'>
              <h1 className="work-title">SpellWorker</h1>
              <p className="work-subtitle" onClick={() => setPyres("True")}>From the start of Work …</p>
            </div>
            <div className="timer-container">
              <div className="timer-display">
                <div className="time-section">
                  <div className="time-box">
                    <span className='time-value'>{settimer(stopCounter.current[1] === 0 ? counter : stopCounter.current[0])[0]}</span>
                  </div>
                  <span className="time-label">HOURS</span>
                </div>

                <span className="separator">:</span>

                <div className="time-section">
                  <div className="time-box">
                    <span className='time-value'>{settimer(stopCounter.current[1] === 0 ? counter : stopCounter.current[0])[1]}</span>
                  </div>
                  <span className="time-label">MINUTES</span>
                </div>
                <span className="separator">:</span>

                <div className="time-section">
                  <div className="time-box">
                    <span className='time-value'>{settimer(stopCounter.current[1] === 0 ? counter : stopCounter.current[0])[2]}</span>
                  </div>
                  <span className="time-label">SECONDS</span>
                </div>
              </div>
            </div>

            <div className="controls">
              <button onClick={() => window.location.reload()} className="control-button">
                <div className="button-icon reset-icon"><RxCross2 /></div>
                <div className='control-text'>
                  <span className="button-text">終了</span>
                  <span className="button-subtext">{JSON.stringify(usedSpell.void1)}</span>
                </div>
              </button>
              {stopCounter.current[1] === 0 ?
                <motion.div
                  className="control-button"
                  initial={{ scale: 1, rotate: 0 }}
                  whileTap={{ scale: 2, rotate: [0, 10, 20, 10, -10, -20, -10, 10, 20, 10, -10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {/* アイコン部分 */}
                  <motion.div
                    className="button-icon stop-icon"
                    onClick={() => stopCount()}
                    whileTap={{ scale: 1.1 }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    <TbPlayerPause />
                  </motion.div>

                  {/* テキスト部分 */}
                  <div className="control-text">
                    <span className="button-text">停止</span>
                    <motion.span
                      className="button-subtext"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8 }}
                    >
                      {JSON.stringify(usedSpell.void2)}
                    </motion.span>
                  </div>
                </motion.div>
                :
                <motion.div
                  className="control-button"
                  initial={{ scale: 1, rotate: 0 }}
                  whileTap={{ scale: 2, rotate: [0, 10, 20, 10, -10, -20, -10, 10, 20, 10, -10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {/* アイコン部分 */}
                  <motion.div
                    className="button-icon start-icon"
                    onClick={() => startCount()}
                    whileTap={{ scale: 1.1 }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    <PiPlayBold />
                  </motion.div>

                  {/* テキスト部分 */}
                  <div className="control-text">
                    <span className="button-text">開始</span>
                    <motion.span
                      className="button-subtext"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8 }}
                    >
                      {JSON.stringify(usedSpell.void2)}
                    </motion.span>
                  </div>
                </motion.div>
              }
            </div>
            <AnimatePresence>
              {dispState === 'sleep' &&
                <div className='alerm-container'>
                  <motion.img
                    key="sleep"
                    animate={{
                      x: ['-19%'],
                      y: ['90%', '25%'], // 画像が左から右に流れる
                    }}
                    transition={{
                      ease: "easeOut",
                      duration: 5, // アニメーションの時間（秒）
                    }}
                    exit={{
                      y: ['25%', '90%'],  // 逆方向に動かす
                      transition: {
                        delay: 1,
                        ease: "easeIn",
                        duration: 5, // 逆アニメーションの時間（秒）
                      },
                    }}
                    className="alerm-img"
                    src={cloud} // 使用する画像を指定
                    alt="Moving Cloud" // 画像の代替テキスト
                  />
                  <motion.div
                    variants={pageFade2}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className='alermspell-container'
                  >
                    <div className="danger-icon"><FiAlertTriangle /></div>
                    <div className='alerm-text'>睡眠を検出しました</div>
                    <button onClick={() => { setDispState('work'); stop(), setPyres("False") }} className="control-button alerm-button">
                      <div className="button-icon alerm-icon"><FiSun /></div>
                      <div className='control-text'>
                        <span className="button-text">目覚める</span>
                        <span className="button-subtext">アラーム呪文</span>
                      </div>
                    </button>
                  </motion.div>
                </div>
              }
            </AnimatePresence>

          </motion.div>
        }
      </AnimatePresence>
    </div>
  )
}

export default App
