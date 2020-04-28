declare namespace NodeJS {
  interface Global {
    window: {
      addEventListener: () => void;
      postMessage: (m: any) => void;
    };
  }
}

declare const __pkg_version__: string;
