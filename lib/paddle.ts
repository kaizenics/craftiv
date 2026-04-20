type PaddleEnvironment = "sandbox" | "production";

type PaddleCheckoutItem = {
  priceId: string;
  quantity?: number;
};

type PaddleCheckoutSettings = {
  displayMode?: "overlay" | "inline";
  theme?: "light" | "dark";
  locale?: string;
  successUrl?: string;
};

type PaddleInstance = {
  Environment: {
    set: (env: PaddleEnvironment) => void;
  };
  Initialize: (options: { token: string }) => void;
  Checkout: {
    open: (options: { items: PaddleCheckoutItem[]; settings?: PaddleCheckoutSettings }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

let paddleScriptPromise: Promise<PaddleInstance> | null = null;
let initializedToken: string | null = null;
let initializedEnv: PaddleEnvironment | null = null;

export async function loadAndInitPaddle(
  token: string,
  env: PaddleEnvironment
): Promise<PaddleInstance> {
  if (!paddleScriptPromise) {
    paddleScriptPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Paddle can only be loaded in the browser."));
        return;
      }

      if (window.Paddle) {
        resolve(window.Paddle);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        if (window.Paddle) {
          resolve(window.Paddle);
        } else {
          reject(new Error("Paddle script loaded but Paddle object was not found."));
        }
      };
      script.onerror = () => reject(new Error("Failed to load Paddle script."));
      document.head.appendChild(script);
    });
  }

  const paddle = await paddleScriptPromise;

  if (initializedEnv !== env) {
    paddle.Environment.set(env);
    initializedEnv = env;
  }

  if (initializedToken !== token) {
    paddle.Initialize({ token });
    initializedToken = token;
  }

  return paddle;
}

