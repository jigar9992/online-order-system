import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RouteFlashState = {
  flashMessage?: string;
} | null;

export function buildRouteFlashState(flashMessage: string): RouteFlashState {
  return { flashMessage };
}

export function useRouteFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const state = location.state as RouteFlashState;
  const nextFlashMessage =
    typeof state?.flashMessage === "string" ? state.flashMessage : null;

  useEffect(() => {
    if (!nextFlashMessage) {
      return;
    }

    queueMicrotask(() => {
      setFlashMessage(nextFlashMessage);
    });

    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    nextFlashMessage,
  ]);

  return {
    flashMessage,
    clearFlashMessage: () => {
      setFlashMessage(null);
    },
  };
}
