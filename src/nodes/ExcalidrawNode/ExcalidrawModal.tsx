/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "./ExcalidrawModal.css";

import Excalidraw from "@excalidraw/excalidraw";
import _default from "@excalidraw/excalidraw";
import * as React from "react";
import { ReactPortal, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useTranslation } from "react-i18next";

export type ExcalidrawElementFragment = {
	isDeleted?: boolean;
};

type Props = {
	closeOnClickOutside?: boolean;
	/**
	 * The initial set of elements to draw into the scene
	 */
	initialElements: ReadonlyArray<ExcalidrawElementFragment>;
	/**
	 * Controls the visibility of the modal
	 */
	isShown?: boolean;
	/**
	 * Completely remove Excalidraw component
	 */
	onDelete: () => boolean;
	/**
	 * Handle modal closing
	 */
	onHide: () => void;
	/**
	 * Callback when the save button is clicked
	 */
	onSave: (elements: ReadonlyArray<ExcalidrawElementFragment>) => void;
};

/**
 * @explorer-desc
 * A component which renders a modal with Excalidraw (a painting app)
 * which can be used to export an editable image
 */
export default function ExcalidrawModal({
	closeOnClickOutside = false,
	onSave,
	initialElements,
	isShown = false,
	onHide,
	onDelete,
}: Props): ReactPortal | null {
	const excalidrawRef = useRef(null);
	const excaliDrawModelRef = useRef(null);
	const [discardModalOpen, setDiscardModalOpen] = useState(false);
	const [elements, setElements] =
		useState<ReadonlyArray<ExcalidrawElementFragment>>(initialElements);
	const { t } = useTranslation(["action"]);

	useEffect(() => {
		if (excaliDrawModelRef.current !== null) {
			excaliDrawModelRef.current.focus();
		}
	}, []);

	useEffect(() => {
		let modalOverlayElement = null;
		const clickOutsideHandler = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			const target = event.target;
			if (
				excaliDrawModelRef.current !== null &&
				!excaliDrawModelRef.current.contains(target) &&
				closeOnClickOutside
			) {
				onDelete();
			}
		};
		if (excaliDrawModelRef.current !== null) {
			modalOverlayElement = excaliDrawModelRef.current?.parentElement;
			if (modalOverlayElement !== null) {
				modalOverlayElement?.addEventListener("click", clickOutsideHandler);
			}
		}

		return () => {
			if (modalOverlayElement !== null) {
				modalOverlayElement?.removeEventListener("click", clickOutsideHandler);
			}
		};
	}, [closeOnClickOutside, onDelete]);

	const save = () => {
		if (elements.filter((el) => !el.isDeleted).length > 0) {
			onSave(elements);
		} else {
			// delete node if the scene is clear
			onDelete();
		}
		onHide();
	};

	const discard = () => {
		if (elements.filter((el) => !el.isDeleted).length === 0) {
			// delete node if the scene is clear
			onDelete();
		} else {
			//Otherwise, show confirmation dialog before closing
			setDiscardModalOpen(true);
		}
	};

	function ShowDiscardDialog(): JSX.Element {
		return (
			<Modal
				title={t("action:Discard")}
				onClose={() => {
					setDiscardModalOpen(false);
				}}
				closeOnClickOutside={true}
			>
				{t("action:Confirm_Discard")}
				<div className="ExcalidrawModal__discardModal">
					<Button
						onClick={() => {
							setDiscardModalOpen(false);
							onHide();
						}}
					>
						{t("action:Discard")}
					</Button>{" "}
					<Button
						onClick={() => {
							setDiscardModalOpen(false);
						}}
					>
						{t("action:Cancel")}
					</Button>
				</div>
			</Modal>
		);
	}

	useEffect(() => {
		excalidrawRef?.current?.updateScene({ elements: initialElements });
	}, [initialElements]);

	if (isShown === false) {
		return null;
	}

	const onChange = (els) => {
		setElements(els);
	};

	// This is a hacky work-around for Excalidraw + Vite.
	// In DEV, Vite pulls this in fine, in prod it doesn't. It seems
	// like a module resolution issue with ESM vs CJS?
	const _Excalidraw = Excalidraw.$$typeof != null ? Excalidraw : _default;

	return createPortal(
		<div className="ExcalidrawModal__overlay" role="dialog">
			<div
				className="ExcalidrawModal__modal"
				ref={excaliDrawModelRef}
				tabIndex={-1}
			>
				<div className="ExcalidrawModal__row">
					{discardModalOpen && <ShowDiscardDialog />}
					<_Excalidraw
						onChange={onChange}
						initialData={{
							appState: { isLoading: false },
							elements: initialElements as ExcalidrawElement[],
						}}
					/>
					<div className="ExcalidrawModal__actions">
						<button className="action-button" onClick={discard}>
							{t("action:Discard")}
						</button>
						<button className="action-button" onClick={save}>
							{t("action:Save")}
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
