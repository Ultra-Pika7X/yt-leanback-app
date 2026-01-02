import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos, Video } from '../api/youtube';
import { VideoCard } from '../components/VideoCard';

export const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            setLoading(true);
            searchVideos(query).then(data => {
                setVideos(data);
                setLoading(false);
            });
        }
    }, [query]);

    if (!query) return <div className="message">Search for something...</div>;
    if (loading) return <div className="loading">Searching for "{query}"...</div>;

    return (
        <div className="page-container">
            <h2 className="section-title">Results for "{query}"</h2>
            <div className="video-grid">
                {videos.length > 0 ? (
                    videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))
                ) : (
                    <div className="message">No results found.</div>
                )}
            </div>
        </div>
    );
};
