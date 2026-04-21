import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RouteFlashState = {
  flashMessage?: string;
  orderId?: string;
} | null;

type RouteFlashOptions = {
  orderId?: string;
};

export function buildRouteFlashState(
  flashMessage: string,
  options: RouteFlashOptions = {},
): RouteFlashState {
  return options.orderId
    ? {
        flashMessage,
        orderId: options.orderId,
      }
    : { flashMessage };
}

export function useRouteFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [flashOrderId, setFlashOrderId] = useState<string | null>(null);
  const state = location.state as RouteFlashState;
  const nextFlashMessage =
    typeof state?.flashMessage === "string" ? state.flashMessage : null;
  const nextOrderId = typeof state?.orderId === "string" ? state.orderId : null;

  useEffect(() => {
    if (!nextFlashMessage && !nextOrderId) {
      return;
    }

    queueMicrotask(() => {
      setFlashMessage(nextFlashMessage);
      setFlashOrderId(nextOrderId);
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
    nextOrderId,
  ]);

  return {
    flashMessage,
    flashOrderId,
    clearFlashMessage: () => {
      setFlashMessage(null);
      setFlashOrderId(null);
    },
  };
}
