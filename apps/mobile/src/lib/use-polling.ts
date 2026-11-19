import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { AppState } from "react-native";

/** Calls `tick` every `ms` while the screen is focused and the app is in the foreground. */
export function usePolling(tick: () => void, ms: number) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setInterval> | null = null;
      const start = () => {
        if (!timer) timer = setInterval(() => tickRef.current(), ms);
      };
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };
      if (AppState.currentState === "active") start();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          tickRef.current();
          start();
        } else {
          stop();
        }
      });
      return () => {
        stop();
        sub.remove();
      };
    }, [ms])
  );
}
