import React, { useEffect, useState } from 'react';
import { getTrending, Video } from '../api/youtube';
import { VideoCard } from '../components/VideoCard';

export const Home = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTrending().then(data => {
            setVideos(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="loading">Loading Trending...</div>;

    return (
        <div className="page-container">
            <h2 className="section-title">Trending Now</h2>
            <div className="video-grid">
                {videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        </div>
    );
};
