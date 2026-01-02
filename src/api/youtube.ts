export interface Video {
    id: string;
    title: string;
    thumbnail: string;
    uploaderName: string;
    uploaderAvatar: string;
    uploadedDate: string;
    views: number;
    duration: number;
}

const PIPED_API = 'https://pipedapi.kavin.rocks';

export const getTrending = async (): Promise<Video[]> => {
    try {
        const res = await fetch(`${PIPED_API}/trending?region=US`);
        const data = await res.json();
        return data.map((item: any) => ({
            id: item.url.split('/watch?v=')[1],
            title: item.title,
            thumbnail: item.thumbnail,
            uploaderName: item.uploaderName,
            uploaderAvatar: item.uploaderAvatar,
            uploadedDate: item.uploadedDate,
            views: item.views,
            duration: item.duration
        }));
    } catch (e) {
        console.error("Failed to fetch trending", e);
        return [];
    }
};

export const searchVideos = async (query: string): Promise<Video[]> => {
    try {
        const res = await fetch(`${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=all`);
        const data = await res.json();
        return data.items
            .filter((item: any) => item.type === 'stream')
            .map((item: any) => ({
                id: item.url.split('/watch?v=')[1],
                title: item.title,
                thumbnail: item.thumbnail,
                uploaderName: item.uploaderName,
                uploaderAvatar: item.uploaderAvatar,
                uploadedDate: item.uploadedDate,
                views: item.views,
                duration: item.duration
            }));
    } catch (e) {
        console.error("Failed to search", e);
        return [];
    }
};

export const getVideo = async (id: string) => {
    try {
        const res = await fetch(`${PIPED_API}/streams/${id}`);
        return await res.json();
    } catch (e) {
        console.error("Failed to get video", e);
        return null;
    }
};
