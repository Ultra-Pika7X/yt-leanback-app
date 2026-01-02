import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getVideo } from '../api/youtube';

export const Watch = () => {
    const [searchParams] = useSearchParams();
    const videoId = searchParams.get('v');
    const [videoData, setVideoData] = useState<any>(null);

    useEffect(() => {
        if (videoId) {
            getVideo(videoId).then(data => setVideoData(data));
        }
    }, [videoId]);

    if (!videoId) return <div>No Video ID</div>;

    // Use Cobalt or similar for download link if possible, or just a direct link provider
    const downloadLink = `https://cobalt.tools/`;

    return (
        <div className="watch-container">
            <div className="player-wrapper">
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="Video Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="iframe-player"
                ></iframe>
            </div>
            <div className="video-info">
                <h1 className="video-title">{videoData?.title || 'Loading title...'}</h1>
                <div className="video-meta">
                    <div className="uploader">
                        {videoData?.uploaderAvatar && <img src={videoData.uploaderAvatar} alt="" />}
                        <span>{videoData?.uploader || 'Unknown Channel'}</span>
                    </div>
                </div>
                <div className="actions">
                    <a href={downloadLink} target="_blank" rel="noreferrer" className="action-btn download-btn">
                        Download Video
                    </a>
                </div>
                <div className="description">
                    {videoData?.description ? (
                        <p>{videoData.description.substring(0, 300)}...</p>
                    ) : (
                        <p>Loading description...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
