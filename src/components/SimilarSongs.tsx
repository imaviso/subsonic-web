import { Music, Play, Shuffle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { SongList } from "@/components/SongList";
import { getSimilarSongs2 } from "@/lib/api";
import { playAlbum } from "@/lib/player";

interface SimilarSongsProps {
	artistId?: string;
}

export function SimilarSongs({ artistId }: SimilarSongsProps) {
	const { data: songs, isLoading } = useQuery({
		queryKey: ["similar-songs", artistId],
		queryFn: () => (artistId ? getSimilarSongs2(artistId) : []),
		enabled: !!artistId,
	});

	if (!artistId) {
		return null;
	}

	const handlePlayAll = () => {
		if (songs && songs.length > 0) {
			playAlbum(songs, 0);
		}
	};

	const handleShufflePlay = () => {
		if (songs && songs.length > 0) {
			const shuffled = [...songs].sort(() => Math.random() - 0.5);
			playAlbum(shuffled, 0);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Music className="w-6 h-6 text-muted-foreground" />
						<h2 className="text-lg font-semibold">Similar Songs</h2>
					</div>
				</div>
				<SongList songs={[]} isLoading />
			</div>
		);
	}

	if (!songs || songs.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Music className="w-6 h-6 text-muted-foreground" />
					<h2 className="text-lg font-semibold">Similar Songs</h2>
					<span className="text-sm text-muted-foreground">
						({songs.length})
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-2"
						onClick={handleShufflePlay}
					>
						<Shuffle className="w-4 h-4" />
						Shuffle
					</Button>
					<Button
						variant="default"
						size="sm"
						className="gap-2"
						onClick={handlePlayAll}
					>
						<Play className="w-4 h-4" />
						Play All
					</Button>
				</div>
			</div>
			<SongList songs={songs} showAlbum showArtist />
		</div>
	);
}
