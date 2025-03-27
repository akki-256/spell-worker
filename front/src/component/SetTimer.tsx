import React, { useEffect, useState } from 'react'

type propsType = {
    setcondhitiontimer: React.Dispatch<React.SetStateAction<string>>;
};

const SetTimer: React.FC<propsType> = ({ setcondhitiontimer }) => {
    const [inputValue, setInputValue] = useState("")

    useEffect(() => {
        setInputValue("00:30:00")
    }, [])

    return (
        <div>
            <div>作業時間の設定</div>
            <input type='time' value={inputValue} onChange={(event) => setInputValue(event.target.value)}></input>
            <button onClick={() => { setcondhitiontimer(inputValue) }}>作業時間を設定</button>
            <button onClick={() => { setcondhitiontimer("設定しない") }}>作業時間を設定せずに進める</button>
        </div>
    )
}

export default SetTimer
