import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	Disc3,
	Download,
	Heart,
	ListEnd,
	ListMusic,
	ListPlus,
	Play,
	Plus,
	User,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Playlist, Song } from "@/lib/api";
import {
	createPlaylist,
	getDownloadUrl,
	getPlaylists,
	star,
	unstar,
	updatePlaylist,
} from "@/lib/api";
import { addToQueue, playNextInQueue, playSong } from "@/lib/player";

interface SongContextMenuProps {
	song: Song;
	/** The full list of songs for queue context */
	songs?: Song[];
	/** Index of this song in the list */
	index?: number;
	children: ReactNode;
}

export function SongContextMenu({
	song,
	songs,
	index,
	children,
}: SongContextMenuProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: playlists } = useQuery({
		queryKey: ["playlists"],
		queryFn: getPlaylists,
	});

	const starMutation = useMutation({
		mutationFn: async (shouldStar: boolean) => {
			if (shouldStar) {
				await star({ id: song.id });
			} else {
				await unstar({ id: song.id });
			}
		},
		onSuccess: (_, shouldStar) => {
			queryClient.invalidateQueries({ queryKey: ["starred"] });
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

	const addToPlaylistMutation = useMutation({
		mutationFn: (playlistId: string) =>
			updatePlaylist({ playlistId, songIdToAdd: [song.id] }),
		onSuccess: (_, playlistId) => {
			queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
			queryClient.invalidateQueries({ queryKey: ["playlists"] });
			const playlist = playlists?.find((p) => p.id === playlistId);
			toast.success(`Added to "${playlist?.name ?? "playlist"}"`);
		},
		onError: () => {
			toast.error("Failed to add to playlist");
		},
	});

	const createPlaylistMutation = useMutation({
		mutationFn: () => createPlaylist({ name: song.title, songId: [song.id] }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["playlists"] });
			toast.success(`Created playlist "${song.title}"`);
		},
		onError: () => {
			toast.error("Failed to create playlist");
		},
	});

	const handlePlay = () => {
		if (songs && index !== undefined) {
			playSong(song, songs, index);
		} else {
			playSong(song);
		}
	};

	const handlePlayNext = () => {
		playNextInQueue(song);
		toast.success("Playing next");
	};

	const handleAddToQueue = () => {
		addToQueue([song]);
		toast.success("Added to queue");
	};

	const handleToggleFavorite = () => {
		starMutation.mutate(!song.starred);
	};

	const handleGoToAlbum = () => {
		if (song.albumId) {
			navigate({
				to: "/app/albums/$albumId",
				params: { albumId: song.albumId },
			});
		}
	};

	const handleGoToArtist = () => {
		if (song.artistId) {
			navigate({
				to: "/app/artists/$artistId",
				params: { artistId: song.artistId },
			});
		}
	};

	const handleAddToPlaylist = (playlistId: string) => {
		addToPlaylistMutation.mutate(playlistId);
	};

	const handleCreatePlaylist = () => {
		createPlaylistMutation.mutate();
	};

	const handleDownload = async () => {
		try {
			const downloadUrl = await getDownloadUrl(song.id);
			// Create a hidden anchor element to trigger download
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = song.title || "song";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch {
			toast.error("Failed to start download");
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				<ContextMenuItem onClick={handlePlay}>
					<Play className="mr-2 h-4 w-4" />
					Play
				</ContextMenuItem>
				<ContextMenuItem onClick={handlePlayNext}>
					<ListMusic className="mr-2 h-4 w-4" />
					Play next
				</ContextMenuItem>
				<ContextMenuItem onClick={handleAddToQueue}>
					<ListEnd className="mr-2 h-4 w-4" />
					Add to queue
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleToggleFavorite}>
					<Heart
						className={`mr-2 h-4 w-4 ${song.starred ? "fill-red-500 text-red-500" : ""}`}
					/>
					{song.starred ? "Remove from favorites" : "Add to favorites"}
				</ContextMenuItem>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<ListPlus className="mr-2 h-4 w-4" />
						Add to playlist
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{playlists && playlists.length > 0 ? (
							<>
								{playlists.map((playlist: Playlist) => (
									<ContextMenuItem
										key={playlist.id}
										onClick={() => handleAddToPlaylist(playlist.id)}
									>
										{playlist.name}
									</ContextMenuItem>
								))}
								<ContextMenuSeparator />
							</>
						) : null}
						<ContextMenuItem onClick={handleCreatePlaylist}>
							<Plus className="mr-2 h-4 w-4" />
							New playlist
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />

				{song.albumId && (
					<ContextMenuItem onClick={handleGoToAlbum}>
						<Disc3 className="mr-2 h-4 w-4" />
						Go to album
					</ContextMenuItem>
				)}
				{song.artistId && (
					<ContextMenuItem onClick={handleGoToArtist}>
						<User className="mr-2 h-4 w-4" />
						Go to artist
					</ContextMenuItem>
				)}

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleDownload}>
					<Download className="mr-2 h-4 w-4" />
					Download
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
