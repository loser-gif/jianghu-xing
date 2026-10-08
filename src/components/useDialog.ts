import { useEffect, useRef, useState } from "react";

/** One lifecycle for every paper dialog, including keyboard and backdrop dismissal. */
export function useDialog(onClose?: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const timer = useRef<number | undefined>(undefined);
  const dismissing = useRef(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer.current);
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  const dismiss = () => {
    if (!close.current || dismissing.current) return;
    dismissing.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      close.current();
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(() => close.current?.(), 160);
  };
  return { ref, closing, dismiss };
}
