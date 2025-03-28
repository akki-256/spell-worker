export const sendPy = async (url: string, blob: Blob) => {
    const formData = new FormData();
    formData.append('frame', blob);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });
    const result = await response.json();
    return result.status
}
