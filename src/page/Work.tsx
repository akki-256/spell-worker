import React, { useEffect, useState } from 'react'


//秒数を投げることで時間分秒形式に直す.他で使う可能性あり
const settimer = ((count: number) => {
    let h = Math.floor(count / 3600).toString()
    let m = Math.floor((count / 60) % 60).toString().padStart(2, '0')
    let s = Math.floor(count % 60).toString().padStart(2, '0')
    return `${h}時間${m}分${s}秒`
});

//作業時間のランキングを作るなら秒数をローカルストレージで管理して比較
//HomeでsetTimer関数を使えるかも

const Work = () => {
    const [counter, setCount] = useState(0);

    //1秒ごとにbounterを加算するだけ
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    return (
        <>
            <div id='timer'>{settimer(counter)}</div>
        </>
    )
}

export default Work