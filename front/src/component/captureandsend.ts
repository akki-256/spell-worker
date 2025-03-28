import { RefObject } from "react";

export const captureAndSendPY = async (video: RefObject<HTMLVideoElement | null>, canvas: RefObject<HTMLCanvasElement>, ctxRef: RefObject<CanvasRenderingContext2D | null>, url: string, setPyres: React.SetStateAction<any>) => {
    if (!video.current) return;
    if (!canvas.current) return;

    canvas.current.width = video.current.videoWidth
    canvas.current.height = video.current.videoHeight
    const ctx = ctxRef.current ?? canvas.current.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.drawImage(video.current, 0, 0, canvas.current.width, canvas.current.height);

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.current.toBlob((b) => resolve(b), 'image/jpeg')
    })
    if (blob) {
        const formData = new FormData();
        formData.append('frame', blob);

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (typeof (result.status) == 'string') setPyres(result.status)
        // sendPy(url, blob).then(respons => {
        //     if (typeof (respons) == 'string') setPyres(respons)
        // })
    }
};