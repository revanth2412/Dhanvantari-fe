import { createContext } from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastInput {
  kind?: ToastKind;
  title: string;
  message?: string;
}

export interface ToastItem extends Required<Pick<ToastInput, "title">> {
  id: number;
  kind: ToastKind;
  message?: string;
  leaving: boolean;
}

export interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
