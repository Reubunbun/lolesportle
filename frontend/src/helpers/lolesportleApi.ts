export default async function lolesportleApi(path: string, options?: RequestInit) {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${path}`,
        {
            ...options,
            headers: {
                ...(options?.headers || {}),
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const responseText = await response.text();
        console.error(`Request to ${path} failed: ${response.status} ${response.statusText} - ${responseText}`);
        throw new Error(responseText);
    }

    return await response.json();
};
