import ReconnectingWebSocket from 'reconnecting-websocket'

const setServer = (url: string, setData?: React.SetStateAction<any>) => {
    const setWebsocket = new ReconnectingWebSocket(url)
    if (setData) {
        setWebsocket.onmessage = async (event) => {
            let data = event.data
            try {
                const currentdata = typeof data === "string" ? JSON.parse(data) : data
                setData(currentdata)
            } catch {
                console.warn("Failed to parse JSON:", data)
                setData(data) // JSON でなければそのまま渡す
            }
        }
    }
    return setWebsocket
}

export default setServer