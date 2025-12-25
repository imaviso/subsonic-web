import { Disc3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AlbumGrid } from "@/components/AlbumCard";
import { getArtistAlbums } from "@/lib/api";

interface MoreByArtistProps {
	artistId?: string;
	excludeAlbumId?: string;
}

export function MoreByArtist({ artistId, excludeAlbumId }: MoreByArtistProps) {
	const { data: albums, isLoading } = useQuery({
		queryKey: ["artist-albums", artistId],
		queryFn: () => (artistId ? getArtistAlbums(artistId) : []),
		enabled: !!artistId,
	});

	const filteredAlbums = albums?.filter((album) => album.id !== excludeAlbumId);

	if (!artistId) {
		return null;
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Disc3 className="w-6 h-6 text-muted-foreground" />
					<h2 className="text-lg font-semibold">More by this artist</h2>
				</div>
				<AlbumGrid albums={[]} isLoading />
			</div>
		);
	}

	if (!filteredAlbums || filteredAlbums.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<Disc3 className="w-6 h-6 text-muted-foreground" />
				<h2 className="text-lg font-semibold">More by this artist</h2>
				<span className="text-sm text-muted-foreground">
					({filteredAlbums.length})
				</span>
			</div>
			<AlbumGrid albums={filteredAlbums} />
		</div>
	);
}
