# @react-libraries/mixed-props

Works similar to getServerSideProps on Next.js.  
The difference is that the processing is done on the client side except during SSR, and the props for the page are cached on the client side.

## usage

- Use `useMixedReload` to remove the cache and re-run getMixedProps.
  - Clear the cache of the current page and reload.
    - useMixedReload()
  - Delete and reload caches whose head matches `/contents`.
    - useMixedReload('/contents')
  - Delete all caches and reload
    - useMixedReload(true)
- If `{cache:false}` is given as the return value of getMixedProps, the props are no longer cached.

### src/pages/\_app.tsx

Functions are allocated to each page component from getInitialProps.

```tsx
import { AppProps } from "next/app";
import { getInitialProps, initMixed } from "@react-libraries/mixed-props";

const App = (props: AppProps) => {
  const { Component } = props;
  const mixedProps = initMixed(props);
  return <Component {...mixedProps} />;
};
App.getInitialProps = getInitialProps;
export default App;
```

### src/pages/index.tsx

By giving getMixedProps to the page component, it behaves in a similar way to getServerSideProps.

```tsx
import React from "react";
import Link from "next/link";
import { GetMixedProps, useMixedReload } from "@react-libraries/mixed-props";
import { WeatherArea } from "../types/weather";

type Props = { area: WeatherArea; date: string };

const Page = ({ area, date }: Props) => {
  const dispatch = useMixedReload();
  return (
    <>
      <div>
        <button onClick={() => dispatch()}>Reload</button>
      </div>
      <div>Update:{new Date(date).toLocaleString()}</div>
      {area &&
        Object.entries(area.offices).map(([code, { name }]) => (
          <div key={code}>
            <Link href={`/weather/${code}`}>
              <a>{name}</a>
            </Link>
          </div>
        ))}
    </>
  );
};
const getMixedProps: GetMixedProps = async () => {
  const area = (await fetch(
    `https://www.jma.go.jp/bosai/common/const/area.json`
  )
    .then((r) => r.json())
    .catch(() => undefined)) as Promise<WeatherArea | undefined>;
  return { props: { area, date: new Date().toISOString() } };
  // If cache is not used
  // return { props: { area, date: new Date().toISOString() } ,cache: false };
};
Page.getMixedProps = getMixedProps;
export default Page;
```

### src/pages/weather/[id].tsx

```tsx
import Link from "next/link";
import React from "react";
import { GetMixedProps, useMixedReload } from "@react-libraries/mixed-props";
import { Weather } from "../../types/weather";

type Props = {
  weather?: Weather;
  date: string;
};

const Page = ({ weather, date }: Props) => {
  const dispatch = useMixedReload();
  return (
    <>
      <div>
        <button onClick={() => dispatch()}>Reload</button>
      </div>
      <div>Update:{new Date(date).toLocaleString()}</div>
      {weather && (
        <>
          <h1>{weather.targetArea}</h1>
          <div>{new Date(weather.reportDatetime).toLocaleString()}</div>
          <div>{weather.headlineText}</div>
          <pre>{weather.text}</pre>
        </>
      )}
      <div>
        <Link href="/">
          <a>Return</a>
        </Link>
      </div>
    </>
  );
};
const getMixedProps: GetMixedProps<Props> = async ({ query }) => {
  const weather = (await fetch(
    `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${query.id}.json`
  )
    .then((r) => r.json())
    .catch(() => undefined)) as Weather | undefined;
  return { props: { weather, date: new Date().toISOString() } };
};
Page.getMixedProps = getMixedProps;
export default Page;
```

### src/pages/types/weather.ts

```ts
export interface Center {
  name: string;
  enName: string;
  officeName?: string;
  children?: string[];
  parent?: string;
  kana?: string;
}
export interface Centers {
  [key: string]: Center;
}
export interface WeatherArea {
  centers: Centers;
  offices: Centers;
  class10s: Centers;
  class15s: Centers;
  class20s: Centers;
}
export interface Weather {
  publishingOffice: string;
  reportDatetime: Date;
  targetArea: string;
  headlineText: string;
  text: string;
}
```
