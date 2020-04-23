declare namespace NodeJS {
  interface Global {
    window: {
      addEventListener: () => void;
      postMessage: (m: any) => void;
    };
  }
}
