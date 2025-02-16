import { ThemeProvider, useTheme } from "@/providers/themeProvider"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { memo, useEffect, useState, useRef, useCallback } from "react"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, focusManager, useIsRestoring } from "@tanstack/react-query"
import { PersistQueryClientProvider, type PersistQueryClientOptions } from "@tanstack/react-query-persist-client"
import { useLocalStorage } from "@uidotdev/usehooks"
import createIDBPersister from "@/lib/queryPersister"
import DragSelect from "@/components/dragSelect"
import DropZone from "@/components/dropZone"
import ConfirmDialog from "@/components/dialogs/confirm"
import SelectDriveItemDialog from "@/components/dialogs/selectDriveItem"
import Transfers from "@/components/transfers"
import PreviewDialog from "@/components/dialogs/previewDialog"
import InputDialog from "@/components/dialogs/input"
import SelectContactsDialog from "@/components/dialogs/selectContacts"
import TransparentFullScreenImageDialog from "@/components/dialogs/transparentFullScreenImage"
import TwoFactorCodeDialog from "@/components/dialogs/twoFactorCode"
import PublicLinkDialog from "@/components/dialogs/publicLink"
import SharedWithDialog from "@/components/dialogs/sharedWith"
import { UNCACHED_QUERY_KEYS } from "@/constants"
import NotificationHandler from "@/components/notificationHandler"
import ActivityHandler from "@/components/activityHandler"
import FileVersionsDialog from "@/components/dialogs/fileVersions"
import NoteHistoryDialog from "@/components/dialogs/noteHistory"
import NoteParticipantsDialog from "@/components/dialogs/noteParticipants"
import { setup as setupApp } from "@/lib/setup"
import CookieConsent from "@/components/cookieConsent"
import ProfileDialog from "@/components/dialogs/profile"
import DarkLogo from "@/assets/img/dark_logo.svg"
import LightLogo from "@/assets/img/light_logo.svg"
import useIsMobile from "@/hooks/useIsMobile"

focusManager.setEventListener(handleFocus => {
	const onFocus = () => {
		handleFocus(true)
	}

	const onBlur = () => {
		handleFocus(false)
	}

	window.addEventListener("focus", () => onFocus, false)
	window.addEventListener("blur", () => onBlur, false)

	return () => {
		window.removeEventListener("focus", onFocus)
		window.removeEventListener("blur", onBlur)
	}
})

export const persistantQueryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnMount: "always",
			refetchOnReconnect: "always",
			refetchOnWindowFocus: "always",
			staleTime: Infinity,
			gcTime: Infinity
		}
	}
})

export const queryClientPersister = createIDBPersister()

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
	persister: queryClientPersister,
	maxAge: Infinity,
	dehydrateOptions: {
		shouldDehydrateQuery(query) {
			return query.queryKey.some(queryKey => UNCACHED_QUERY_KEYS.includes(queryKey as unknown as string))
		}
	}
}

export const Loading = memo(() => {
	const { dark } = useTheme()
	const isMobile = useIsMobile()

	return (
		<div className="flex flex-row w-screen h-[100dvh] items-center justify-center">
			<img
				src={dark ? LightLogo : DarkLogo}
				className={isMobile ? "w-[80px] h-[80px]" : "w-[128px] h-[128px]"}
				draggable={false}
			/>
		</div>
	)
})

export const Root = memo(() => {
	const [ready, setReady] = useState<boolean>(false)
	const [authed] = useLocalStorage<boolean>("authed", false)
	const initRef = useRef<boolean>(false)
	const isRestoring = useIsRestoring()

	const setup = useCallback(async () => {
		try {
			await setupApp()

			console.log("Setup done")

			setReady(true)
		} catch (e) {
			console.error(e)
		}
	}, [])

	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true

			setup()
		}
	}, [setup])

	return (
		<main className="overflow-hidden">
			<ThemeProvider>
				<PersistQueryClientProvider
					client={persistantQueryClient}
					persistOptions={persistOptions}
				>
					{!ready || isRestoring ? (
						<Loading />
					) : (
						<>
							<CookieConsent>
								{authed ? (
									<>
										<DropZone>
											<DragSelect>
												<NotificationHandler>
													<ActivityHandler>
														<Outlet />
													</ActivityHandler>
												</NotificationHandler>
											</DragSelect>
										</DropZone>
										<SelectDriveItemDialog />
										<SelectContactsDialog />
										<PublicLinkDialog />
										<SharedWithDialog />
										<FileVersionsDialog />
										<NoteHistoryDialog />
										<NoteParticipantsDialog />
									</>
								) : (
									<Outlet />
								)}
								<Transfers />
								<PreviewDialog />
								<InputDialog />
								<ConfirmDialog />
								<TransparentFullScreenImageDialog />
								<TwoFactorCodeDialog />
								<ProfileDialog />
							</CookieConsent>
						</>
					)}
				</PersistQueryClientProvider>
			</ThemeProvider>
			<Toaster />
		</main>
	)
})

export const Route = createRootRoute({
	component: Root,
	notFoundComponent: () => <div>404</div>
})
