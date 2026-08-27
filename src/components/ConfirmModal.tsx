import Modal from "./Modal.tsx";
import { btnOutline, btnDanger, btnSignal } from "./ui.ts";

/** Modal konfirmasi generik (RULES #7: tak boleh confirm() native). */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  danger = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="space-y-5 text-[14px]">
        <div className="leading-relaxed text-text-dim">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnOutline}>
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? btnDanger : btnSignal}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
