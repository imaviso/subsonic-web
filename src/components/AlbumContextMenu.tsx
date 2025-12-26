import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heart, ListEnd, Play, Shuffle, User } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Album } from "@/lib/api";
import { getAlbum, star, unstar } from "@/lib/api";
import { addToQueue, playAlbum } from "@/lib/player";

interface AlbumContextMenuProps {
	album: Album;
	children: ReactNode;
}

export function AlbumContextMenu({ album, children }: AlbumContextMenuProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const starMutation = useMutation({
		mutationFn: async (shouldStar: boolean) => {
			if (shouldStar) {
				await star({ albumId: album.id });
			} else {
				await unstar({ albumId: album.id });
			}
		},
		onSuccess: (_, shouldStar) => {
			queryClient.invalidateQueries({ queryKey: ["starred"] });
			queryClient.invalidateQueries({ queryKey: ["albums"] });
			queryClient.invalidateQueries({ queryKey: ["album", album.id] });
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

	const handlePlay = async () => {
		try {
			const { songs } = await getAlbum(album.id);
			if (songs.length > 0) {
				playAlbum(songs, 0);
			}
		} catch {
			toast.error("Failed to play album");
		}
	};

	const handleShuffle = async () => {
		try {
			const { songs } = await getAlbum(album.id);
			if (songs.length > 0) {
				const shuffled = [...songs].sort(() => Math.random() - 0.5);
				playAlbum(shuffled, 0);
			}
		} catch {
			toast.error("Failed to shuffle album");
		}
	};

	const handleAddToQueue = async () => {
		try {
			const { songs } = await getAlbum(album.id);
			if (songs.length > 0) {
				addToQueue(songs);
				toast.success(`Added ${songs.length} songs to queue`);
			}
		} catch {
			toast.error("Failed to add to queue");
		}
	};

	const handleToggleFavorite = () => {
		starMutation.mutate(!album.starred);
	};

	const handleGoToArtist = () => {
		if (album.artistId) {
			navigate({
				to: "/app/artists/$artistId",
				params: { artistId: album.artistId },
			});
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
				<ContextMenuItem onClick={handleShuffle}>
					<Shuffle className="mr-2 h-4 w-4" />
					Shuffle
				</ContextMenuItem>
				<ContextMenuItem onClick={handleAddToQueue}>
					<ListEnd className="mr-2 h-4 w-4" />
					Add to queue
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleToggleFavorite}>
					<Heart
						className={`mr-2 h-4 w-4 ${album.starred ? "fill-red-500 text-red-500" : ""}`}
					/>
					{album.starred ? "Remove from favorites" : "Add to favorites"}
				</ContextMenuItem>

				{album.artistId && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={handleGoToArtist}>
							<User className="mr-2 h-4 w-4" />
							Go to artist
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
