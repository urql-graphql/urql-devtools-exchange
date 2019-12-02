declare namespace NodeJS {
  interface Global {
    window: {
      addEventListener: () => void;
    };
  }
}
