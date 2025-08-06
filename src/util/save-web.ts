
/**
 * Saves text to an HTML file. This works in either a browser or Electron
 * context.
 */
export async function saveWeb(storyId: string, source: string) {
    const response = await fetch(`/api/stories/publish/${storyId}`, {
        method: 'POST',
        body: JSON.stringify({ source }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return await response.json();
}
