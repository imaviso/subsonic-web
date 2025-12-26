import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ListEnd, Play, Shuffle } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Artist, Song } from "@/lib/api";
import { getAlbum, getArtist, star, unstar } from "@/lib/api";
import { addToQueue, playAlbum } from "@/lib/player";

interface ArtistContextMenuProps {
	artist: Artist;
	children: ReactNode;
}

export function ArtistContextMenu({
	artist,
	children,
}: ArtistContextMenuProps) {
	const queryClient = useQueryClient();

	const starMutation = useMutation({
		mutationFn: async (shouldStar: boolean) => {
			if (shouldStar) {
				await star({ artistId: artist.id });
			} else {
				await unstar({ artistId: artist.id });
			}
		},
		onSuccess: (_, shouldStar) => {
			queryClient.invalidateQueries({ queryKey: ["starred"] });
			queryClient.invalidateQueries({ queryKey: ["artists"] });
			queryClient.invalidateQueries({ queryKey: ["artist", artist.id] });
			toast.success(
				shouldStar ? "Added to favorites" : "Removed from favorites",
			);
		},
		onError: (_, shouldStar) => {
			toast.error(
				shouldStar
					? "Failed to add to favorites"
					: "Failed to remove from favorites",
			);
		},
	});

	// Fetch all songs from all albums by the artist
	const fetchArtistSongs = async (): Promise<Song[]> => {
		const { albums } = await getArtist(artist.id);
		const allSongs: Song[] = [];

		// Fetch songs from each album
		for (const album of albums) {
			const { songs } = await getAlbum(album.id);
			allSongs.push(...songs);
		}

		return allSongs;
	};

	const handlePlay = async () => {
		try {
			const songs = await fetchArtistSongs();
			if (songs.length > 0) {
				playAlbum(songs, 0);
			} else {
				toast.error("No songs found");
			}
		} catch {
			toast.error("Failed to play artist");
		}
	};

	const handleShuffle = async () => {
		try {
			const songs = await fetchArtistSongs();
			if (songs.length > 0) {
				const shuffled = [...songs].sort(() => Math.random() - 0.5);
				playAlbum(shuffled, 0);
			} else {
				toast.error("No songs found");
			}
		} catch {
			toast.error("Failed to shuffle artist");
		}
	};

	const handleAddToQueue = async () => {
		try {
			const songs = await fetchArtistSongs();
			if (songs.length > 0) {
				addToQueue(songs);
				toast.success(`Added ${songs.length} songs to queue`);
			} else {
				toast.error("No songs found");
			}
		} catch {
			toast.error("Failed to add to queue");
		}
	};

	const handleToggleFavorite = () => {
		starMutation.mutate(!artist.starred);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				<ContextMenuItem onClick={handlePlay}>
					<Play className="mr-2 h-4 w-4" />
					Play all
				</ContextMenuItem>
				<ContextMenuItem onClick={handleShuffle}>
					<Shuffle className="mr-2 h-4 w-4" />
					Shuffle all
				</ContextMenuItem>
				<ContextMenuItem onClick={handleAddToQueue}>
					<ListEnd className="mr-2 h-4 w-4" />
					Add all to queue
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleToggleFavorite}>
					<Heart
						className={`mr-2 h-4 w-4 ${artist.starred ? "fill-red-500 text-red-500" : ""}`}
					/>
					{artist.starred ? "Remove from favorites" : "Add to favorites"}
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
