interface VideoData {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_url: string;
  duration_seconds?: number;
  // Legacy fields for backward compatibility
  thumbnail?: string;
  director?: string;
  production?: string;
  useVideoPreview?: boolean;
  videoUrl?: string;
}

interface VideoCardProps {
  video: VideoData;
  onClick: (video: VideoData) => void;
  isPremium?: boolean;
}

const VideoCard = ({ video, onClick, isPremium }: VideoCardProps) => {
  const thumbnail = video.thumbnail_url || video.thumbnail;
  const videoUrl = video.video_url || video.videoUrl;
  const useVideoPreview = video.useVideoPreview || !thumbnail;
  const director = video.director || 'Unknown';
  const production = video.production || 'Chombezo Tamu';

  return (
    <div
      className="bg-card border border-border cursor-pointer"
      onClick={() => onClick(video)}
    >
      <div className="relative aspect-video group">
        {useVideoPreview ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Premium Overlay Badge */}
        {isPremium && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold border border-white">
            PREMIUM
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display font-bold text-sm text-foreground leading-tight">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {director} · {production}
        </p>
      </div>
    </div>
  );
};

export default VideoCard;
