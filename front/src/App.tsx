import {useEffect, useRef, useState } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import setServer from './component/setServer'
import setUpSpell from './component/setUpSpell'
import useSound from 'use-sound'
import defaultAlarmSound from '../default-alarm-sound.mp3'
import wandImage from "../public/SpellWorker Wand.svg";
import "@fontsource/MedievalSharp";
import "../src/App.css";
import { RxCross2 } from "react-icons/rx";
import { PiPlayBold } from "react-icons/pi";
import { TbPlayerPause } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";

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
    nitroSocketRef.current = setServer('ws://localhost:spell', setnitroRes)
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
      shuffleImages();
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

  const images = ["/img1.svg", "/img2.svg", "/img3.svg", "/img4.svg", "/img5.svg", "/img6.svg"];
  const [displayImages, setDisplayImages] = useState<DisplayImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);

  const generateGridPositions = (count: number): ImageStyle[] => {
    const styles: ImageStyle[] = [];
    const size = 40;
    const padding = 0;
    
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    const totalWidthSpace = 100 - (size + padding * 2);
    const totalHeightSpace = 100 - (size + padding * 2);
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      let left = (totalWidthSpace / (cols - 1)) * col;
      let top = (totalHeightSpace / (rows - 1)) * row;
      
      const jitter = 5;
      left += Math.random() * jitter - jitter/2;
      top += Math.random() * jitter - jitter/2;
      
      left = Math.max(padding, Math.min(100 - size - padding, left));
      top = Math.max(padding, Math.min(100 - size - padding, top));
      
      const rotation = Math.random() * 10 - 5;
      
      styles.push({
        width: `${size}%`,
        height: `${size}%`,
        top: `${top}%`,
        left: `${left}%`,
        transform: `rotate(${rotation}deg)`,
        opacity: 1,
        zIndex: 1
      });
    }
    
    return styles;
  };

  const shuffleImages = () => {
    setImageError(false);
    setDisplayImages(prev => 
      prev.map(img => ({
        ...img,
        style: { ...img.style, opacity: 0 }
      }))
    );

    setTimeout(() => {
      const randomImageIndex = Math.floor(Math.random() * images.length);
      const newSelectedImage = images[randomImageIndex];
      setSelectedImage(newSelectedImage);

      const numberOfImages = Math.floor(Math.random() * 2) + 9;
      const gridPositions = generateGridPositions(numberOfImages);
      
      const newImages: DisplayImage[] = [];
      
      for (let i = 0; i < numberOfImages; i++) {
        newImages.push({
          url: newSelectedImage,
          style: { ...gridPositions[i], opacity: 0 }
        });
      }

      setDisplayImages(newImages);

      requestAnimationFrame(() => {
        setDisplayImages(newImages.map(img => ({
          ...img,
          style: { ...img.style, opacity: 1 }
        })));
      });
    }, 300);
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load image:', selectedImage);
  };



  return (
    <>
      {dispState === 'title' &&
        <div className='container'>
          <img src={wandImage} alt="Magic Wand" className="wand" />
          <h1 className="title">SpellWorker</h1>
          <p className="subtitle">Stay Awake with Magic</p>
          <div className="spell-button" onClick={() => setDispState('start')}>Get Ready Casting pell</div>
        </div>
      }
      {dispState === 'start' &&
        <div className='container'>
          <img src={wandImage} alt="Magic Wand" className="wand" />
          <h1 className="title">SpellWorker</h1>
          <div className="spell-button" onClick={() => {
            setDispState('work')
            const interval = setInterval(() => {
              setCounter(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
          }}>Cast Opening Spell</div>
      </div>
      }
      {dispState === 'work' &&
        <>
        <div>
          <div className="header">
            <img src={wandImage} alt="Magic Wand" className="headerlogo" />
            <h1 className="hedaertitle" onClick={() => setPyres(true)}>SpellWorker</h1>
          </div>
          
          <div className="timer-container">
            <div className="timer-display">
              <div className="time-section">
                <span className="time-label">Hours</span>
                <div className="time-box">
                  <span className='time-value'>{settimer(stopCounter.current < 0 ? counter : stopCounter.current)[0]}</span>
                </div>
              </div>

              <span className="separator">:</span>

              <div className="time-section">
                <span className="time-label">Minutes</span>
                <div className="time-box">
                  <span className='time-value'>{settimer(stopCounter.current < 0 ? counter : stopCounter.current)[1]}</span>
                </div>
              </div>
              <span className="separator">:</span>

              <div className="time-section">
                <span className="time-label">Minutes</span>
                <div className="time-box">
                  <span className='time-value'>{settimer(stopCounter.current < 0 ? counter : stopCounter.current)[2]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="controls">
            <button onClick={() => window.location.reload()} className="control-button">
              <div className="button-icon reset-icon"><RxCross2 /></div>
              <span className="button-text">終了</span>
              <span className="button-subtext">{JSON.stringify(usedSpell.void1)}</span>
            </button>

            {stopCounter.current! < 0 ?
              <button className="control-button" onClick={() => stopCount()}>
                <div className="button-icon stop-icon"> <TbPlayerPause /> </div>
                <span className="button-text">停止</span>
                <span className="button-subtext">{JSON.stringify(usedSpell.void2)}</span>
              </button>
            :
              <button className="control-button" onClick={() => startCount()}>
                <div className="button-icon start-icon"> <PiPlayBold /></div>
                <span className="button-text">開始</span>
                <span className="button-subtext">{JSON.stringify(usedSpell.void2)}</span>
              </button>
            }
          </div>
        </div>
        </>
      }
      {dispState === 'sleep' &&
        <>
        <div>
          <div className="min-h-screen bg-black overflow-hidden relative">
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <p>Failed to load images. Please check the image paths.</p>
              </div>
            ) : (
              displayImages.map((image, index) => (
                <img
                  key={`${image.url}-${index}`}
                  src={image.url}
                  alt={`SVG ${index + 1}`}
                  onError={handleImageError}
                  className="alerm-img"
                  style={image.style}
                />
              ))
            )}
          </div>
          <div className='alermspell-container'>
            <div onClick={() => { setDispState('work'); stop() ,setPyres(false)}} className="alerm-text">
              呪文
            </div>
            <div className="alerm-subtext">魔法を使ってアラームを停止せよ</div>
          </div>
        </div>
        </>
      }
    </>
  )
}

export default App