import ReconnectingWebSocket from 'reconnecting-websocket'

const setServer = (url: string, setData?: any) => {
    const setWebsocket = new ReconnectingWebSocket(url)
    if (setData) {
        setWebsocket.onmessage = (event) => {
            const data = event.data
            setData(data)
        }
    }
    return setWebsocket
}

export default setServer