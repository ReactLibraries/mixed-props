import { AppContext, AppProps } from "next/app";
import { useRouter } from "next/router";
import { useCallback } from "react";

export type MixedProps<T = object> = {
  props?: T;
  cache?: boolean;
};

export type GetMixedProps<T = object> = (
  context: AppContext["ctx"],
  component: AppContext["Component"]
) => Promise<MixedProps<T>>;

type MixedAppComponent = AppContext["Component"] & {
  getMixedProps?: GetMixedProps<unknown>;
};
type MixedAppContext = AppContext & {
  Component: MixedAppComponent;
};

const isServer = typeof window === "undefined";

const cache: { [key: string]: unknown } = {};
export const useMixedReload = () => {
  const router = useRouter();
  const pagePath = router.asPath;
  return useCallback(
    (path?: string | boolean) => {
      if (typeof path === "undefined" || path === false) {
        cache[pagePath] && delete cache[pagePath];
      } else {
        Object.keys(cache).forEach(
          (key) =>
            (path === true || pagePath.startsWith(key)) &&
            delete cache[pagePath]
        );
      }
      router.replace(pagePath);
    },
    [pagePath]
  );
};

export const getInitialProps = async (context: MixedAppContext) => {
  const { ctx, Component } = context;
  const pagePath = ctx.asPath;
  if (!isServer && pagePath && cache[pagePath])
    return { props: cache[pagePath] };
  return Component.getMixedProps?.(context.ctx, Component) || {};
};

export const initMixed = (appProps: AppProps) => {
  const {
    props,
    router,
    cache: cacheType,
  } = appProps as AppProps & MixedProps & MixedAppContext;
  if (!isServer && cacheType !== false) cache[router.asPath] = props;
  return props;
};
