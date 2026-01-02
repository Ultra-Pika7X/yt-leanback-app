import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from '../api/youtube';

interface VideoCardProps {
    video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    const navigate = useNavigate();

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    return (
        <div
            className="flex flex-col gap-2 cursor-pointer group"
            onClick={() => navigate(`/watch?v=${video.id}`)}
        >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#202020]">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(video.duration)}
                </div>
            </div>
            <div className="flex gap-2 items-start mt-1">
                <img
                    src={video.uploaderAvatar}
                    alt={video.uploaderName}
                    className="w-9 h-9 rounded-full bg-[#202020]"
                />
                <div className="flex flex-col">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                        {video.title}
                    </h3>
                    <p className="text-[#aaa] text-xs mt-1">
                        {video.uploaderName} • {formatViews(video.views)} views • {video.uploadedDate}
                    </p>
                </div>
            </div>
        </div>
    );
};
